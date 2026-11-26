#!/usr/bin/env bash
# ─────────────────────────────────────────────
#  pause.sh  –  Stop all Foodmatrix services
#  Scales EKS node group to 0 (no EC2 cost)
#  Optionally stops RDS too
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

echo "⏸  Pausing Foodmatrix..."

# ── 1. Scale all pods to 0 first (clean shutdown)
echo "→ Scaling all deployments to 0..."
$KUBECTL scale deployment --all -n foodmatrix --replicas=0
echo "   ✓ Pods scaled down"

# ── 2. EKS Auto mode — node auto-terminates when pods = 0
#    (No traditional nodegroup to scale; EKS Auto handles it)
echo "→ EKS Auto mode: node will auto-terminate in ~2-5 min (no pods running)"

# ── 3. Optionally stop RDS
echo ""
read -r -p "→ Stop RDS database too? (saves ~\$0.02/hr, 7-day max pause) [y/N]: " STOP_RDS
if [[ "$STOP_RDS" =~ ^[Yy]$ ]]; then
  RDS_ID=$($AWS rds describe-db-instances \
    --region "$REGION" \
    --query "DBInstances[?contains(DBInstanceIdentifier,'foodmatrix')].DBInstanceIdentifier | [0]" \
    --output text)

  if [[ "$RDS_ID" == "None" || -z "$RDS_ID" ]]; then
    echo "   ⚠ No RDS instance found with 'foodmatrix' in name. Skipping."
  else
    echo "→ Stopping RDS: $RDS_ID"
    $AWS rds stop-db-instance --db-instance-identifier "$RDS_ID" --region "$REGION" > /dev/null
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
