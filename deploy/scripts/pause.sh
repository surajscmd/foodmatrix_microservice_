#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  pause.sh  –  Stop all Foodmatrix services
#  Scales EKS node group to 0 (no EC2 cost)
#  Optionally stops RDS too
# ─────────────────────────────────────────────
set -euo pipefail

CLUSTER="foodmatrix-staging"
REGION="ap-south-1"

# ── Detect kubectl: use local if available, else route through Jenkins container
if command -v kubectl &>/dev/null; then
  KUBECTL="kubectl"
else
  echo "   ℹ kubectl not found locally — using Jenkins container"
  KUBECTL="docker exec foodmatrix-jenkins kubectl"
fi

echo "⏸  Pausing Foodmatrix..."

# ── 1. Scale all pods to 0 first (clean shutdown)
echo "→ Scaling all deployments to 0..."
$KUBECTL scale deployment --all -n foodmatrix --replicas=0
echo "   ✓ Pods scaled down"

# ── 2. Find nodegroup automatically
NODEGROUP=$(aws eks list-nodegroups \
  --cluster-name "$CLUSTER" \
  --region "$REGION" \
  --query "nodegroups[0]" \
  --output text)

echo "→ Scaling nodegroup '$NODEGROUP' to 0 (shuts down EC2)..."
aws eks update-nodegroup-config \
  --cluster-name "$CLUSTER" \
  --nodegroup-name "$NODEGROUP" \
  --scaling-config minSize=0,maxSize=3,desiredSize=0 \
  --region "$REGION" > /dev/null
echo "   ✓ EC2 node will shut down in ~1-2 min"

# ── 3. Optionally stop RDS
echo ""
read -r -p "→ Stop RDS database too? (saves ~\$0.02/hr, 7-day max pause) [y/N]: " STOP_RDS
if [[ "$STOP_RDS" =~ ^[Yy]$ ]]; then
  RDS_ID=$(aws rds describe-db-instances \
    --region "$REGION" \
    --query "DBInstances[?contains(DBInstanceIdentifier,'foodmatrix')].DBInstanceIdentifier | [0]" \
    --output text)

  if [[ "$RDS_ID" == "None" || -z "$RDS_ID" ]]; then
    echo "   ⚠ No RDS instance found with 'foodmatrix' in name. Skipping."
  else
    echo "→ Stopping RDS: $RDS_ID"
    aws rds stop-db-instance --db-instance-identifier "$RDS_ID" --region "$REGION" > /dev/null
    echo "   ✓ RDS stopping (takes ~1-2 min)"
  fi
else
  echo "   → RDS left running"
fi

echo ""
echo "✅ Foodmatrix paused!"
echo ""
echo "   What still costs money:"
echo "   • RDS (if you skipped stopping it) ~\$0.02/hr"
echo "   • ECR image storage              ~\$0.10/GB/month"
echo ""
echo "   Run ./resume.sh to bring everything back up."
