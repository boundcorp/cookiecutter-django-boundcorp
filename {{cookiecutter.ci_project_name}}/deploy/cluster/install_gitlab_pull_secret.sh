#!/usr/bin/env bash
cd $(dirname $0)/../..

kubectl create ns justposted-staging
kubectl apply -f deploy/cluster/gitlab-pull-secret.secrets.yaml -n justposted-staging
kubectl create ns justposted-production
kubectl apply -f deploy/cluster/gitlab-pull-secret.secrets.yaml -n justposted-production
