from sqlalchemy import BigInteger, String, Boolean, TIMESTAMP, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id:         Mapped[int]  = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    username:   Mapped[str]  = mapped_column(String(64), unique=True, nullable=False, index=True)
    email:      Mapped[str]  = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_admin:   Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[str]  = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=text("NOW()"),
        nullable=False
    )

    # relationships
    repos           = relationship("Repo", back_populates="owner", foreign_keys="Repo.owner_id")
    issues_authored = relationship("Issue", back_populates="author", foreign_keys="Issue.author_id")
    comments        = relationship("Comment", back_populates="author")
    notifications   = relationship("Notification", back_populates="user")
    watched_repos   = relationship("RepoWatcher", back_populates="user")

    def __repr__(self):
        return f"<User {self.username}>"