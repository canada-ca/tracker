from alembic.config import Config
from alembic.script import ScriptDirectory

# From here:
# https://blog.jerrycodes.com/multiple-heads-in-alembic-migrations/
def test_only_single_head_revision_in_migrations():
    config = Config()
    config.set_main_option("script_location", "app:migrations")
    script = ScriptDirectory.from_config(config)

    # This will raise if there are multiple heads
    script.get_current_head()
