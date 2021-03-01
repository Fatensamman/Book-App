'use strict';

//libraries
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const superagent = require('superagent');
const pg = require('pg');

///// app setup //////
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3030;
// to access static file
app.use(express.static('./public'));
// to add data to body using middlewhere
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

const client = new pg.Client(process.env.DATABASE_URL);
// const client = new pg.Client({connectionString: process.env.DATABASE_URL,ssl: { rejectUnauthorized: false },});



///// routes//////
//home route
app.get('/', homeHandeler);
//searches/new route
app.get('/searches/new', navHandeler);
//searches route
app.post('/searches', showHandeler);
//get one book route
app.get('/book/:bookid', idhandeler);
//addbook to bookshelf
app.post('/books', bookshelfHandeler);
//error route
app.get('*', errorHandeler);



////// functions ////// 
// home function
function homeHandeler(req, res) {
    let SQL = `SELECT * FROM books;`;
    client.query(SQL).then(result => {
        res.render('./pages/index', { booksList: result.rows });
    })
        .catch((error => {
            console.log(`error in home`, error);
        }));
};

//searches/new function
function navHandeler(req, res) {
    res.render('pages/searches/new')
};

//searches function
function showHandeler(req, res) {
    let sort = req.body.sort;
    let search = req.body.search;
    //inauthor
    //intitle:
    let url = `https://www.googleapis.com/books/v1/volumes?q=${search}+${sort}:keyes`;

    superagent.get(url)
        .then(results => {
            let data = results.body.items;
            let book = data.map(item => {
                return new Book(item);
            })
            res.render('./pages/searches/show', { bookLists: book });
        });
};

//get one book route
function idhandeler(req, res) {
    let SQL = `SELECT * FROM books WHERE id = $1;`;
    console.log(req.params.bookid)
    let safe = [req.params.bookid]
    client.query(SQL, safe).then(result => {
        res.render('pages/books/details', { book: result.rows[0] });
    })
        .catch(error => {
            console.log('error', error.message);
        });
};


//addbook to bookshelf
function bookshelfHandeler(req, res) {
    let { image, title, author, description } = req.body;
    let SQL = `INSERT INTO books (image, title, author, description) VALUES($1, $2, $3, $4) RETURNING id;`;
    let safeValues = [image, title, author, description];
    let SQL2 = `SELECT * FROM books WHERE title=$1;`;
    let value = [title];

    client.query(SQL2, value)
        .then((results) => {
            if (results.rows[0]) {
                res.redirect(`/book/${results.rows[0].id}`);
            } else {
                client
                    .query(SQL, safeValues)
                    .then((results) => {
                        res.redirect(`/book/${results.rows[0].id}`);
                    })
                    .catch((error) => {
                        console.log('Error: ', error);
                    });
            }
        })
        .catch((error) => {
            console.log('Error: ', error);
        });
};

//error function
function errorHandeler(req, res) {
    res.render('pages/error');
};


////// constructors //////
function Book(data) {
    this.image = data.volumeInfo.imageLinks.thumbnail ? data.volumeInfo.imageLinks.thumbnail : 'https://i.imgur.com/J5LVHEL.jpg';
    this.title = data.volumeInfo.title ? data.volumeInfo.title : 'no title';
    this.description = data.volumeInfo.description ? data.volumeInfo.description : 'No description for This Book';
    this.author = data.volumeInfo.authors ? data.volumeInfo.authors.join(" ") : "Author is Unknown"
}

////// listin //////
client.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`http://localhost:${PORT}`)
        });
    });
