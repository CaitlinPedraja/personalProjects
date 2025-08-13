#import what we need
from requests_html import HTMLSession
import pandas as pd
import traceback
session = HTMLSession()

#use session to get the page
r = session.get('https://news.google.com/topstories?hl=en-GB&gl=GB&ceid=GB:en')

#render the html, sleep=1 to give it a second to finish before moving on. scrolldown= how many times to page down on the browser, to get more results. 5 was a good number here
r.html.render(sleep=1, scrolldown=1)

articles = r.html.find("article")

titles_df = pd.dataframe()
for item in articles:
    try:
        newsitem = item.find('h4', first = True)
        titles_df.append(newsitem.title)
    except: 
        print(traceback)

