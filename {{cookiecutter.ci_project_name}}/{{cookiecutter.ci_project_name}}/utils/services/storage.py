import os
import subprocess
from datetime import timedelta

import urllib3
from django.conf import settings
from django.core.files import File
from minio import Minio
from PIL import Image
from reportlab.graphics import renderPM
from svglib.svglib import svg2rlg


def presigned_put_object(key, content_type, expires=3600):
    if "minio" in settings.DEFAULT_FILE_STORAGE:
        return minio_presigned_put_object(key, expires)
    elif "gcloud" in settings.DEFAULT_FILE_STORAGE:
        return gcp_presigned_put_object(key, content_type, expires)


def gcp_presigned_put_object(key, content_type, expires=3600):
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


def minio_presigned_put_object(key, expires=3600):
    client = Minio(
        settings.MINIO_STORAGE_MEDIA_URL.split("/")[2],
        access_key=settings.MINIO_STORAGE_ACCESS_KEY,
        secret_key=settings.MINIO_STORAGE_SECRET_KEY,
        secure=False,
        http_client=urllib3.ProxyManager("http://minio:9000"),
    )
    return (
            settings.MINIO_STORAGE_MEDIA_URL
            + "/"
            + "/".join(
        client.presigned_put_object(
            settings.MINIO_STORAGE_MEDIA_BUCKET_NAME, key, expires=timedelta(seconds=expires)
        ).split("/")[4:]
    )
    )
