from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('system', '0012_alter_grade_finals'),
    ]

    operations = [
        migrations.AddField(
            model_name='grade',
            name='remarks',
            field=models.TextField(blank=True),
        ),
        migrations.CreateModel(
            name='GradeHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[('CREATED', 'Created'), ('UPDATED', 'Updated'), ('DELETED', 'Deleted')], max_length=10)),
                ('previous', models.JSONField(blank=True, null=True)),
                ('current', models.JSONField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('changed_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('grade', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='history', to='system.grade')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
