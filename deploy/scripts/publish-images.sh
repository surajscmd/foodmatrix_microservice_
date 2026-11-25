#!/usr/bin/env bash
set -euo pipefail
: "${AWS_REGION:?Set AWS_REGION}"
: "${IMAGE_REGISTRY:?Set the ECR repository prefix}"
: "${IMAGE_TAG:?Set the tested Git SHA}"
[[ "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]] || { echo 'IMAGE_TAG must be a full Git SHA.' >&2; exit 1; }
[[ "$IMAGE_REGISTRY" =~ ^[0-9]{12}\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com/foodmatrix$ ]] || {
  echo 'IMAGE_REGISTRY must be the ECR foodmatrix prefix.' >&2; exit 1;
}
registry="${IMAGE_REGISTRY%%/*}"
auth="$(mktemp -d)"
export DOCKER_CONFIG="$auth"
trap 'rm -rf "$auth"' EXIT
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$registry"
for image in frontend kong organization-service hr-service catalog-service order-service inventory-service notification-service; do
  if aws ecr describe-images --region "$AWS_REGION" --repository-name "foodmatrix/$image" \
      --image-ids "imageTag=$IMAGE_TAG" >/dev/null 2>"$auth/ecr-error"; then
    echo "Reusing immutable image: $image:$IMAGE_TAG"
    continue
  fi
  if ! grep -q ImageNotFoundException "$auth/ecr-error"; then cat "$auth/ecr-error" >&2; exit 1; fi
  docker tag "foodmatrix/$image:$IMAGE_TAG" "$IMAGE_REGISTRY/$image:$IMAGE_TAG"
  docker push "$IMAGE_REGISTRY/$image:$IMAGE_TAG"
done
