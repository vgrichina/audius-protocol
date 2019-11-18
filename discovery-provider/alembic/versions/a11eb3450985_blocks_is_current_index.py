"""blocks is_current index

Revision ID: a11eb3450985
Revises: dbefdfcc9a3b
Create Date: 2019-11-18 13:10:07.019270

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a11eb3450985'
down_revision = 'dbefdfcc9a3b'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_index(op.f('is_current_blocks_idx'), 'blocks', ['is_current'], unique=False)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('is_current_blocks_idx'), table_name='blocks')
    # ### end Alembic commands ###
