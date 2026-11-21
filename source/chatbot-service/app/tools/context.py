import contextvars

# Context variables to hold user session tokens and role across tool execution
current_jwt_token = contextvars.ContextVar("current_jwt_token", default=None)
current_user_id = contextvars.ContextVar("current_user_id", default=None)
current_user_role = contextvars.ContextVar("current_user_role", default="customer")
