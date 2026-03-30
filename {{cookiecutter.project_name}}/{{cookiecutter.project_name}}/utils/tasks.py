from celery import shared_task


@shared_task
def example_task():
    """Example Celery task. Replace or remove in your project."""
    return "ok"
