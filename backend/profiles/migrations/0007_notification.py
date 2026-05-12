from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('profiles', '0006_password_reset_auditlog'),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=120)),
                ('message', models.TextField()),
                ('category', models.CharField(choices=[('GENERAL', 'General'), ('OFFERING', 'Offering'), ('ENROLLMENT', 'Enrollment'), ('GRADE', 'Grade')], default='GENERAL', max_length=20)),
                ('payload', models.JSONField(blank=True, default=dict)),
                ('is_read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('recipient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='profiles.user')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]