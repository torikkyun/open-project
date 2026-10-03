import unittest

from pydantic import ValidationError

from src.modules.projects.schema import ProjectCreate
from src.modules.tasks.schema import CommentCreate, TaskCreate
from src.modules.users.schema import UserCreate


class RequestSchemaTests(unittest.TestCase):
    def test_rejects_blank_names_and_comments(self) -> None:
        for model, payload in (
            (
                UserCreate,
                {
                    "email": "employee@example.com",
                    "full_name": "  ",
                    "password": "long-enough-password",
                },
            ),
            (ProjectCreate, {"name": "  "}),
            (TaskCreate, {"title": "  "}),
            (CommentCreate, {"body": "  "}),
        ):
            with self.subTest(model=model.__name__):
                with self.assertRaises(ValidationError):
                    model(**payload)

    def test_normalizes_user_email_and_project_name(self) -> None:
        user = UserCreate(
            email="Employee@Example.com",
            full_name=" Employee ",
            password="long-enough-password",
        )
        project = ProjectCreate(name=" Roadmap ")

        self.assertEqual(user.email, "employee@example.com")
        self.assertEqual(user.full_name, "Employee")
        self.assertEqual(project.name, "Roadmap")

    def test_rejects_unknown_task_status(self) -> None:
        with self.assertRaises(ValidationError):
            TaskCreate(title="Ship API", status="blocked")


if __name__ == "__main__":
    unittest.main()
