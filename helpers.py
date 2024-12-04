import unicodedata


def normalize_name(name: str) -> str:
    """
    Normalize a name by:
    1. Converting to lowercase
    2. Removing diacritics (accents)
    3. Converting special characters to their basic form
    """
    # Convert to lowercase
    name = name.lower()

    # Normalize unicode characters and remove diacritics
    normalized = unicodedata.normalize("NFKD", name)
    normalized = "".join(c for c in normalized if not unicodedata.combining(c))

    # Replace special characters with their basic form
    replacements = {"ø": "o", "æ": "ae", "å": "a", "ß": "ss", "ð": "d", "þ": "th"}

    for old, new in replacements.items():
        normalized = normalized.replace(old, new)

    return normalized
