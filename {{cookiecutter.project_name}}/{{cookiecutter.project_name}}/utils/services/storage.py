from datetime import timedelta

from django.conf import settings


def _get_s3_client():
    import boto3
    return boto3.client(
        "s3",
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )


def presigned_put_object(key, content_type, expires=3600):
    if hasattr(settings, "GS_CREDENTIALS"):
        return _gcp_presigned_put_object(key, content_type, expires)
    if hasattr(settings, "AWS_S3_ENDPOINT_URL"):
        client = _get_s3_client()
        return client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=expires,
        )
    raise RuntimeError("No object storage configured — set S3_ENDPOINT_URL or GOOGLE_APPLICATION_CREDENTIALS")


def presigned_get_object(key, expires=86400):
    if hasattr(settings, "GS_CREDENTIALS"):
        return _gcp_presigned_get_object(key, expires)
    if hasattr(settings, "AWS_S3_ENDPOINT_URL"):
        client = _get_s3_client()
        return client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
                "Key": key,
            },
            ExpiresIn=expires,
        )
    raise RuntimeError("No object storage configured — set S3_ENDPOINT_URL or GOOGLE_APPLICATION_CREDENTIALS")


def _gcp_presigned_put_object(key, content_type, expires=3600):
    from google.cloud import storage
    client = storage.Client(credentials=settings.GS_CREDENTIALS)
    bucket = client.bucket(settings.GS_BUCKET_NAME)
    blob = bucket.blob(key)
    return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(seconds=expires),
        content_type=content_type,
        method="PUT",
    )


def _gcp_presigned_get_object(key, expires=86400):
    from google.cloud import storage
    client = storage.Client(credentials=settings.GS_CREDENTIALS)
    bucket = client.bucket(settings.GS_BUCKET_NAME)
    blob = bucket.blob(key)
    return blob.generate_signed_url(
        version="v4",
        method="GET",
        expiration=timedelta(seconds=expires),
    )
