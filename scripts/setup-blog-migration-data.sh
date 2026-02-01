#!/bin/bash
# Setup blog migration data in Kubernetes
# This script creates a PVC and copies the blog data into it

set -e

NAMESPACE="studojo"
PVC_NAME="blog-migration-data"

echo "📦 Setting up blog migration data in Kubernetes..."

# Create PVC if it doesn't exist
if ! kubectl get pvc "$PVC_NAME" -n "$NAMESPACE" &> /dev/null; then
    echo "Creating PVC..."
    kubectl apply -f k8s/maverick/pvc-blog-data.yaml
    
    echo "Waiting for PVC to be bound..."
    kubectl wait --for=condition=Bound pvc/$PVC_NAME -n $NAMESPACE --timeout=60s
else
    echo "PVC already exists"
fi

# Create a temporary pod to copy data
echo "Creating temporary pod to copy data..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: blog-data-copy-$(date +%s)
  namespace: $NAMESPACE
spec:
  containers:
  - name: copy
    image: busybox
    command: ['sh', '-c', 'sleep 3600']
    volumeMounts:
    - name: blog-data
      mountPath: /data
  volumes:
  - name: blog-data
    persistentVolumeClaim:
      claimName: $PVC_NAME
  restartPolicy: Never
EOF

POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=blog-data-copy -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || kubectl get pods -n $NAMESPACE | grep blog-data-copy | awk '{print $1}' | head -1)

if [ -z "$POD_NAME" ]; then
    echo "Waiting for pod to be ready..."
    sleep 5
    POD_NAME=$(kubectl get pods -n $NAMESPACE | grep blog-data-copy | awk '{print $1}' | head -1)
fi

echo "Waiting for pod $POD_NAME to be ready..."
kubectl wait --for=condition=Ready pod/$POD_NAME -n $NAMESPACE --timeout=60s || {
    echo "Pod not ready, but continuing..."
}

# Copy data files
echo "Copying blog posts JSON..."
kubectl cp data/studojo.blog_posts.json $NAMESPACE/$POD_NAME:/data/studojo.blog_posts.json

echo "Copying blog images..."
kubectl exec -n $NAMESPACE $POD_NAME -- mkdir -p /data/blog-images || true
for img in data/blog-images/*; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  Copying $filename..."
        kubectl cp "$img" $NAMESPACE/$POD_NAME:/data/blog-images/$filename
    fi
done

# Cleanup
echo "Cleaning up temporary pod..."
kubectl delete pod $POD_NAME -n $NAMESPACE --ignore-not-found=true

echo ""
echo "✅ Blog migration data setup complete!"
echo ""
echo "Next: Run the migration job:"
echo "  kubectl apply -f k8s/maverick/job-migrate-blogs.yaml"

