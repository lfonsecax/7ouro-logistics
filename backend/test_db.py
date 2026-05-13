import psycopg2  
conn = psycopg2.connect(host='db.tnjggwrgawvgojpdntle.supabase.co', port=5432, user='postgres', password='7Ourologistics159753*', dbname='postgres', sslmode='require', connect_timeout=10)  
print('DB OK:', conn.closed)  
conn.close() 
