'use strict';

//libraries
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const superagent = require('superagent');

// app setup
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3030;
// to access static file
app.use(express.static('./public'));
// to add data to body using middlewhere
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// routes
//home route
app.get('/', (req, res) => {
    res.render('./pages/index');
});

//searches/new route
app.get('/searches/new', (req, res) => {
    res.render('pages/searches/new')
});

//searches route
app.post('/searches', (req, res) => {
    let sort = req.body.sort;
    let search = req.body.search;

    let url = `https://www.googleapis.com/books/v1/volumes?q=${search}+${sort}:keyes`;

    superagent.get(url)
        .then(results => {
            let data = results.body.items;
            let book = data.map(item => {
                return new Book(item);
            })
            res.render('./pages/searches/searches', { bookLists: book });
        });
});

//constructors
function Book(data) {
    this.image = data.volumeInfo.imageLinks.thumbnail ? data.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
    this.title = data.volumeInfo.title ? data.volumeInfo.title : 'no title';
    this.description = data.volumeInfo.description ? data.volumeInfo.description : 'No description for This Book';
    this.author = data.volumeInfo.authors ? data.volumeInfo.authors.join(" ") : "Author is Unknown"
}

// listin
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`)
});