import csv
import re

def clean_name(html_name):
    # Remove HTML tags (like <a>...</a>)
    clean_text = re.sub(r'<.*?>', '', html_name)
    # Replace common HTML entities
    clean_text = clean_text.replace('&amp;', '&')
    clean_text = clean_text.replace('&nbsp;', ' ')
    clean_text = clean_text.replace('&#39;', "'")
    # Escape single quotes for SQL
    clean_text = clean_text.replace("'", "''")
    return clean_text.strip()

sql_statements = []
with open('dine_ontario_with_tags.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = clean_name(row['Restaurant name'])
        price = row['Price Tag']
        cuisine = row['Cuisine Tag']
        if price and cuisine:
            # Generate update statement based on name
            sql = f"UPDATE public.restaurants SET price_tag = '{price}', cuisine_tag = '{cuisine}' WHERE name = '{name}';"
            sql_statements.append(sql)

# Output all statements as a single block
with open('update_tags.sql', 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_statements))

print("Generated update_tags.sql")
