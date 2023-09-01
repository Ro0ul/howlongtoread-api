const puppeteer = require("puppeteer");
const express = require("express");
const app = express();

const newPage = async(path = "")=>{
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://howlongtoread.com/${path}`);
    return page;
}

app.get("/",async(req, res)=>{
    let page = newPage();
    const popularBooks = await (await page).evaluate(()=> 
        Array.from(document.querySelectorAll(".popular-books .book-container .book-img-inner-container"),(e)=> ({
            link : e.querySelector("a").href,
            image : e.querySelector(".book-img").src,
            coverName : e.querySelector(".book-img").alt,
            path : {
                id : e.querySelector("a").href.split("/")[4],
                title : e.querySelector("a").href.split("/")[5],
                fullPath : `/${e.querySelector("a").href.split("/")[5]}/${e.querySelector("a").href.split("/")[4]}`
            },
            title : e.querySelector("a").href.split("/")[5]
        }))
    );
    const recommendedBooks = await (await page).evaluate(()=> 
        Array.from(document.querySelectorAll(".recommended-books .book-container .book-img-inner-container"),(e)=> ({
            link : e.querySelector("a").href,
            image : e.querySelector(".book-img").src,
            coverName : e.querySelector(".book-img").alt,
            path : {
                id : e.querySelector("a").href.split("/")[4],
                title : e.querySelector("a").href.split("/")[5],
                fullPath : `/${e.querySelector("a").href.split("/")[5]}/${e.querySelector("a").href.split("/")[4]}`
            },
            title : e.querySelector("a").href.split("/")[5]
        }))
    );
    res.json({
        "popularBooks":popularBooks,
        "recommendedBooks":recommendedBooks
    });
});

app.get("/search/:bookName",async(req, res)=>{
    const {bookName} = req.params;
    let page = newPage(`results/${bookName}`);
    const resultBooks = await (await page).evaluate(()=>
        Array.from(document.querySelectorAll(".item-container"),(e)=> ({
            link : e.querySelector("a").href,
            image : e.querySelector(".book-img").src,
            coverName : e.querySelector(".book-img").alt,
            path : {
                id : e.querySelector("a").href.split("/")[4],
                fullPath : `/${e.querySelector("a").href.split("/")[4]}`
            },
            title : e.querySelector("a").href.split("/")[5]
        })) 
    )
    res.json({
        "results":resultBooks
    });
});

app.get("/book/:bookId",async(req, res)=>{
    const {bookId} = req.params;
    let page = newPage(`books/${bookId}`);
    await (await page).waitForSelector(".book-main",{timeout:6000}).catch(e=>{
        res.status(404);
        res.json("Book Not Found");
    }).then(async()=>{
        const book = await (await page).$$eval(".book-main",(elements)=>
            elements.map((e)=>({
                title : e.querySelector("h1").innerText,
                author : e.querySelector(".author-text").innerText,
                image: e.querySelector(".book-img").src,
                amazonLink : e.querySelector(".v-center").href,
                additionalInfo : {
                    wordsCount : document.querySelector("div.col-4:nth-child(1) > p").innerText,
                    pagesNumber : document.querySelector("div.col-4:nth-child(2) > p:nth-child(2)").innerText,
                    audioBookDuration : document.querySelector("div.col-4:nth-child(3) > p:nth-child(2)").innerText
                },
                description : document.querySelector(".d-sm-block > p:nth-child(2)").innerText,
                averageReadTime : document.querySelector(".col-12 > p:nth-child(3)").innerText
            }))
        )
        const similaryBooks = await (await page).$$eval(".book-carousel .book-container",(elements)=>
            elements.map((e)=>({
                link: e.querySelector("a").href,
                image: e.querySelector("img").src,
                cover: e.querySelector("img").alt
            }))
        )
        res.json({
            "book":book,
            "similarBooks":similaryBooks
        });
    });
});

app.get("/book/:bookId/:bookName",async(req, res)=>{
    const {bookId, bookName} = req.params;
    let page = newPage(`books/${bookId}/${bookName}`);
    const html = await (await page).content();
    res.json(html);
});

app.listen(8080);