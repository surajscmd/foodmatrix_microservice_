#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  resume.sh  –  Start all Foodmatrix services
#  Scales EKS node group back to 1
#  Optionally starts RDS too
# ─────────────────────────────────────────────
set -euo pipefail

CLUSTER="foodmatrix-staging"
REGION="ap-south-1"

# ── Detect kubectl (local → .exe → Jenkins container)
if command -v kubectl &>/dev/null; then
  KUBECTL="kubectl"
elif command -v kubectl.exe &>/dev/null; then
  KUBECTL="kubectl.exe"
elif command -v docker.exe &>/dev/null; then
  echo "   ℹ Using Jenkins container for kubectl"
  KUBECTL="docker.exe exec foodmatrix-jenkins kubectl"
elif command -v docker &>/dev/null; then
  echo "   ℹ Using Jenkins container for kubectl"
  KUBECTL="docker exec foodmatrix-jenkins kubectl"
else
  echo "❌ kubectl not found. Install kubectl or start Docker Desktop."
  exit 1
fi

# ── Detect aws CLI (native → .exe)
if command -v aws &>/dev/null; then
  AWS="aws"
elif command -v aws.exe &>/dev/null; then
  AWS="aws.exe"
else
  echo "❌ aws CLI not found."
  exit 1
fi

echo "▶  Resuming Foodmatrix..."

# ── 1. Find nodegroup automatically
NODEGROUP=$($AWS eks list-nodegroups \
  --cluster-name "$CLUSTER" \
  --region "$REGION" \
  --query "nodegroups[0]" \
  --output text)

# ── 2. Scale EC2 node back up
echo "→ Scaling nodegroup '$NODEGROUP' to 1..."
$AWS eks update-nodegroup-config \
  --cluster-name "$CLUSTER" \
  --nodegroup-name "$NODEGROUP" \
  --scaling-config minSize=1,maxSize=3,desiredSize=1 \
  --region "$REGION" > /dev/null
echo "   ✓ EC2 node starting (takes ~3-5 min)..."

# ── 3. Optionally start RDS
echo ""
read -r -p "→ Start RDS database too? [y/N]: " START_RDS
if [[ "$START_RDS" =~ ^[Yy]$ ]]; then
  RDS_ID=$($AWS rds describe-db-instances \
    --region "$REGION" \
    --query "DBInstances[?contains(DBInstanceIdentifier,'foodmatrix')].DBInstanceIdentifier | [0]" \
    --output text)

  if [[ "$RDS_ID" == "None" || -z "$RDS_ID" ]]; then
    echo "   ⚠ No RDS instance found with 'foodmatrix' in name. Skipping."
  else
    RDS_STATUS=$($AWS rds describe-db-instances \
      --db-instance-identifier "$RDS_ID" \
      --region "$REGION" \
      --query "DBInstances[0].DBInstanceStatus" \
      --output text)

    if [[ "$RDS_STATUS" == "stopped" ]]; then
      echo "→ Starting RDS: $RDS_ID"
      $AWS rds start-db-instance --db-instance-identifier "$RDS_ID" --region "$REGION" > /dev/null
      echo "   ✓ RDS starting (takes ~3-5 min)"
    else
      echo "   ✓ RDS already $RDS_STATUS — no action needed"
    fi
  fi
fi

# ── 4. Wait for node to be Ready
echo ""
echo "→ Waiting for EKS node to be Ready..."
for i in $(seq 1 24); do
  NODE_STATUS=$($KUBECTL get nodes --no-headers 2>/dev/null | awk '{print $2}' | head -1)
  if [[ "$NODE_STATUS" == "Ready" ]]; then
    echo "   ✓ Node is Ready!"
    break
  fi
  echo "   ... ($i/24) node status: ${NODE_STATUS:-Pending} — waiting 15s"
  sleep 15
done

# ── 5. Scale pods back up
echo "→ Scaling all deployments back to 1..."
$KUBECTL scale deployment --all -n foodmatrix --replicas=1
echo "   ✓ Pods starting"

# ── 6. Wait for pods to be Running
echo "→ Waiting for pods to be Running..."
$KUBECTL rollout status deployment -n foodmatrix --timeout=180s 2>/dev/null || true

echo ""
echo "✅ Foodmatrix is live!"
echo ""
$KUBECTL get pods -n foodmatrix
