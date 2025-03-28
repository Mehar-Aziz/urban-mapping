import os
import resend
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    def __init__(self):
        # Set the API key from environment variables
        resend.api_key = os.getenv("RESEND_API_KEY")
    
    def send_password_reset_email(self, to_email: str, reset_link: str):
        """
        Send a password reset email.
        
        :param to_email: Recipient's email address
        :param reset_link: Password reset link with token
        :return: Email sending result
        """
        try:
            params = {
                "from": "onboarding@resend.dev",
                "to": to_email,
                "subject": "Password Reset Request",
                "html": f"""
                <html>
                <body>
                    <h2>Password Reset Request</h2>
                    <p>You have requested to reset your password. Click the link below to reset:</p>
                    <a href="{reset_link}">Reset Password</a>
                    <p>If you did not request this, please ignore this email.</p>
                    <p>This link will expire in 1 hour.</p>
                </body>
                </html>
                """
            }
            
            # Call the send method on resend.Emails
            response = resend.Emails.send(params)
            return response
        except Exception as e:
            print(f"Error sending email: {e}")
            return None

# Create a singleton instance
email_service = EmailService()
