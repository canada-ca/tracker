from slugify import slugify


def slugify_value(value):
    text = slugify(
        text=value,
        lowercase=True,
    )
    return text
