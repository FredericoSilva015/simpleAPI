import express from 'express';
import { load } from 'cheerio';
import axios from 'axios';

const PORT = process.env.PORT || 8000;
const app = express();

const newspapers = [
  {
    name: 'theguardian',
    address: 'https://www.theguardian.com/environment/climate-crisis',
    base: 'https://www.theguardian.com',
  },
  {
    name: 'telegraph',
    address: 'https://www.telegraph.co.uk/environment/',
    base: 'https://www.telegraph.co.uk',
  },
  {
    name: 'thetimes',
    address: 'https://www.thetimes.co.uk/environment',
    base: 'https://www.thetimes.co.uk',
  },
];

// url Validator
const isValidUrl = (urlString) => {
  const urlPattern = new RegExp(
    '^(https?:\\/\\/)?' + // validate protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  ); // validate fragment locator
  return !!urlPattern.test(urlString);
};

const urlBaseSet = (url, base) => {
  if (!isValidUrl(url)) {
    url = base + url;
  }

  return url;
};

const articles = [];

newspapers.forEach((newspaper) => {
  axios
    .get(newspaper.address)
    .then((response) => {
      const html = response.data;
      const $ = load(html);
      $('a:contains("climate")', html).each((_, e) => {
        const title = $(e).text();
        let url = $(e).attr('href');
        if (url == undefined) throw new Error('Element undefined');
        url = urlBaseSet(url, newspaper.base);

        articles.push({
          title,
          url,
          source: newspaper.name,
        });
      });
    })
    .catch((err) => console.log(err));
});

app.get('/', (_, res) => {
  res.json('Welcome to my api');
});

app.get('/news', (_, res) => {
  res.json(articles);
});

app.get('/news/:newspaperId', (req, res) => {
  const newspaperId = req.params.newspaperId;

  const specificNewspaper = newspapers.find(
    (newspaper) => newspaper.name == newspaperId
  );

  if (specificNewspaper == undefined) {
    res.json('No newspaper found');
    throw new Error('specificNewspaper is undefined');
  }

  axios
    .get(specificNewspaper.address)
    .then((response) => {
      const html = response.data;
      const $ = load(html);
      const specificArticles = [];

      $('a:contains("climate")', html).each((_, e) => {
        const title = $(e).text();
        let url = $(e).attr('href');
        if (url == undefined) throw new Error('Element undefined');
        url = urlBaseSet(url, specificNewspaper.base);

        specificArticles.push({
          title,
          url,
          source: newspaperId,
        });
      });
      res.json(specificArticles);
    })
    .catch((err) => console.log(err));
});

app.listen(PORT, () => console.log(`Server running on PORT: ${PORT}`));
