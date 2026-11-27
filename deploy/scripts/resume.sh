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

# ── 1. Optionally start RDS first (takes ~3-5 min to boot)
read -r -p "→ Start RDS database too? [Y/n]: " START_RDS
START_RDS="${START_RDS:-Y}"
if [[ "$START_RDS" =~ ^[Yy]$ ]]; then
  RDS_ID=$($AWS rds describe-db-instances \
    --region "$REGION" \
    --query "DBInstances[?contains(DBInstanceIdentifier,'foodmatrix')].DBInstanceIdentifier | [0]" \
    --output text | tr -d '\r')

  if [[ "$RDS_ID" == "None" || -z "$RDS_ID" ]]; then
    echo "   ⚠ No RDS instance found with 'foodmatrix' in name. Skipping."
  else
    RDS_STATUS=$($AWS rds describe-db-instances \
      --db-instance-identifier "$RDS_ID" \
      --region "$REGION" \
      --query "DBInstances[0].DBInstanceStatus" \
      --output text | tr -d '\r')

    if [[ "$RDS_STATUS" == "stopping" ]]; then
      echo "→ RDS '$RDS_ID' is currently stopping — waiting for it to finish stopping first..."
      $AWS rds wait db-instance-stopped --db-instance-identifier "$RDS_ID" --region "$REGION"
      RDS_STATUS="stopped"
    fi

    if [[ "$RDS_STATUS" == "stopped" ]]; then
      echo "→ Starting RDS: $RDS_ID"
      $AWS rds start-db-instance --db-instance-identifier "$RDS_ID" --region "$REGION" > /dev/null
      echo "   ✓ RDS starting (takes ~3-5 min)"
    elif [[ "$RDS_STATUS" == "available" || "$RDS_STATUS" == "starting" ]]; then
      echo "   ✓ RDS is '$RDS_STATUS' — no action needed"
    else
      echo "   ⚠ RDS is in '$RDS_STATUS' state — skipping start"
    fi
  fi
fi

# ── 2. Scale pods back up FIRST (triggers EKS Auto mode to provision node)
echo ""
echo "→ Scaling all deployments and statefulsets back to 1..."
if [[ -n "$($KUBECTL get statefulset -n foodmatrix --no-headers 2>/dev/null | tr -d '\r')" ]]; then
  $KUBECTL scale statefulset --all -n foodmatrix --replicas=1
fi
$KUBECTL scale deployment --all -n foodmatrix --replicas=1
if $KUBECTL get namespace monitoring &>/dev/null; then
  echo "→ Scaling monitoring namespace back to 1..."
  $KUBECTL scale deployment --all -n monitoring --replicas=1 2>/dev/null || true
  if [[ -n "$($KUBECTL get statefulset -n monitoring --no-headers 2>/dev/null | tr -d '\r')" ]]; then
    $KUBECTL scale statefulset --all -n monitoring --replicas=1 2>/dev/null || true
  fi
fi
echo "   ✓ Pods scheduled (EKS Auto mode will provision an EC2 node automatically)"

# ── 3. Wait for node to be Ready
echo ""
echo "→ Waiting for EKS node to be Ready (takes ~2-4 min)..."
for i in $(seq 1 24); do
  NODE_STATUS=$($KUBECTL get nodes --no-headers 2>/dev/null | tr -d '\r' | awk '{print $2}' | head -1)
  if [[ "$NODE_STATUS" == "Ready" ]]; then
    echo "   ✓ Node is Ready!"
    break
  fi
  echo "   ... ($i/24) node status: ${NODE_STATUS:-Provisioning} — waiting 15s"
  sleep 15
done

# ── 4. Wait for pods to be Available
echo "→ Waiting for deployments to be Available (up to 5 min)..."
if $KUBECTL wait --for=condition=Available deployment --all -n foodmatrix --timeout=300s; then
  echo ""
  echo "✅ Foodmatrix is live!"
else
  echo ""
  echo "⚠ Some deployments are still starting (if RDS is still booting, they will recover automatically):"
fi
echo ""
$KUBECTL get pods -n foodmatrix

TUNNEL_URL=$($KUBECTL logs -n foodmatrix deployment/cloudflared --tail=50 2>/dev/null | tr -d '\r' | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -1 || true)
if [[ -n "$TUNNEL_URL" ]]; then
  echo ""
  echo "🌐 Public URL: $TUNNEL_URL"
fi
