import requests
from datetime import datetime

from database import SessionLocal
import models


def check_website(url):
    try:
        if not url.startswith("http"):
            url = "http://" + url

        response = requests.get(url, timeout=5)

        return {
            "status": "up" if response.status_code == 200 else "down",
            "status_code": response.status_code,
            "response_time": response.elapsed.total_seconds()
        }

    except:
        return {
            "status": "down",
            "status_code": None,
            "response_time": None
        }


def run_monitoring():
    db = SessionLocal()

    domains = db.query(models.Domain).all()

    for domain in domains:
        result = check_website(domain.domain_name)

        domain.current_status = result["status"]
        domain.last_check = datetime.utcnow()

        new_check = models.Check(
            domain_id=domain.id,
            status=result["status"],
            status_code=result["status_code"],
            response_time=result["response_time"]
        )

        db.add(new_check)

    db.commit()
    db.close()


if __name__ == "__main__":
    run_monitoring()