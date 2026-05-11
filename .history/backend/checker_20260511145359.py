import requests
import smtplib
from email.mime.text import MIMEText
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


def send_email(to_email, domain):
    sender = "tarrechaimae@gmail.com"
    password = "حطي هنا App Password ديالك"

    subject = f"Site Down: {domain}"
    body = f"The site {domain} is DOWN."

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender, password)
            server.sendmail(sender, to_email, msg.as_string())

        print("Email sent successfully")

    except Exception as e:
        print("Email error:", e)


def run_monitoring():
    db = SessionLocal()

    domains = db.query(models.Domain).all()

    for domain in domains:
        result = check_website(domain.domain_name)

        print(domain.domain_name, result)

        domain.current_status = result["status"]
        domain.last_check = datetime.utcnow()

        new_check = models.Check(
            domain_id=domain.id,
            status=result["status"],
            status_code=result["status_code"],
            response_time=result["response_time"]
        )

        db.add(new_check)

        if result["status"] == "down":
            print("Sending email for:", domain.domain_name)
            send_email("tarrechaimae@gmail.com", domain.domain_name)

    db.commit()
    db.close()


if __name__ == "__main__":
    run_monitoring()