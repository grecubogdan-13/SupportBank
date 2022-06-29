"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const { XMLParser, XMLBuilder, XMLValidator } = require("../node_modules/fast-xml-parser");
var log4js = require("log4js");
var logger = log4js.getLogger("Transactions");
log4js.configure({
    appenders: {
        file: { type: 'fileSync', filename: 'logs/debug.log' }
    },
    categories: {
        default: { appenders: ['file'], level: 'debug' }
    }
});
let rl = require('readline-sync');
class Record {
    constructor(date, from, to, narrative, sum) {
        this.date = "";
        this.from = "";
        this.to = "";
        this.narrative = "";
        this.sum = 0;
        this.date = date;
        this.from = from;
        this.to = to;
        this.narrative = narrative;
        this.sum = sum;
    }
}
class Person {
    constructor(name, money) {
        this.money = 0;
        this.name = "";
        this.transactions = [];
        this.name = name;
        this.money = money;
    }
    transaction(sum) {
        this.money = this.money + sum;
    }
    addTransaction(transaction) {
        this.transactions.push(transaction);
    }
}
function readCSVFile(filename) {
    let fs = require("fs");
    let textByLine = fs.readFileSync(filename).toString().split("\r\n");
    console.log(textByLine);
    let res = textByLine.map((line) => line.split(","));
    console.log(res);
    res = res.slice(1);
    console.log(res);
    return res;
}
function readJSONFile(filename) {
    let fs = require("fs");
    let transactions = JSON.parse(fs.readFileSync(filename).toString());
    console.log(transactions);
    let transactionsString = [];
    for (let i = 0; i < transactions.length; i++) {
        let transactionString = [];
        console.log(transactions[i]);
        transactionString.push(transactions[i]["Date"]);
        transactionString.push(transactions[i]["FromAccount"]);
        transactionString.push(transactions[i]["ToAccount"]);
        transactionString.push(transactions[i]["Narrative"]);
        transactionString.push(transactions[i]["Amount"]);
        transactionsString.push(transactionString);
    }
    console.log(transactionsString);
    return transactionsString;
}
function readXMLFile(filename) {
    let fs = require("fs");
    let transactions = fs.readFileSync(filename).toString();
    const { XMLParser } = require('fast-xml-parser');
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_"
    });
    //console.log(transactions);
    let parsedData = parser.parse(transactions);
    let transactionsList = parsedData["TransactionList"]["SupportTransaction"];
    let transactionsString = [];
    for (let i = 0; i < transactionsList.length; i++) {
        let transactionString = [];
        //console.log(transactionsList[i]);
        let parsedDate = new Date((parseInt(transactionsList[i]["@_Date"]) - 25568) * 86400000);
        console.log(transactionsList["@_Date"]);
        transactionString.push(parsedDate.toString());
        transactionString.push(transactionsList[i]["Parties"]["From"]);
        transactionString.push(transactionsList[i]["Parties"]["To"]);
        transactionString.push(transactionsList[i]["Description"]);
        transactionString.push(transactionsList[i]["Value"].toString());
        transactionsString.push(transactionString);
    }
    console.log(transactionsString);
    return transactionsString;
}
function parseDataArray(data_array) {
    let records = [];
    for (let i = 0; i < data_array.length; i++) {
        let date = data_array[i][0];
        let dateOkCSV = date.match(/[0-9].[0-9].\/[0-9].[0-9].\/[0-9].[0-9].[0-9].[0-9]./g);
        let dateOkJSON = date.match(/[0-9].[0-9].[0-9].[0-9].-[0-9].[0-9]-[0-9].[0-9].T[0-9].[0-9].:[0-9].[0-9].:[0-9].[0-9]./g);
        let dateOkXML = date.match(/[A-Z].[a-z].[a-z]. [A-Z].[a-z].[a-z]. [0-9].[0-9]. [0-9].[0-9].:[0-9].[0-9].:[0-9].[0-9]. GMT\+0100 \(British Summer Time\)/g);
        if (!dateOkCSV && !dateOkJSON && !dateOkXML) {
            logger.log("Error", "Wrong Date, check line " + i);
        }
        let to = data_array[i][1];
        let from = data_array[i][2];
        let narrative = data_array[i][3];
        if (isNaN(parseFloat(data_array[i][4]))) {
            logger.log("Error", "Invalid Amount, check line " + i);
        }
        let sum = parseFloat(data_array[i][4]);
        let record = new Record(date, to, from, narrative, sum);
        records.push(record);
    }
    return records;
}
function evalTransactions(transactions) {
    let people = [];
    for (let i = 0; i < transactions.length; i++) {
        let searchFrom = 0;
        let negativeAmount = transactions[i].sum * (-1);
        for (let j = 0; j < people.length; j++) {
            if (transactions[i].from == people[j].name) {
                people[j].transaction(negativeAmount);
                people[j].addTransaction(transactions[i]);
                searchFrom = 1;
                break;
            }
        }
        if (searchFrom == 0) {
            let newPerson = new Person(transactions[i].from, negativeAmount);
            newPerson.addTransaction(transactions[i]);
            people.push(newPerson);
        }
        let searchTo = 0;
        for (let j = 0; j < people.length; j++) {
            if (transactions[i].to == people[j].name) {
                people[j].transaction(transactions[i].sum);
                people[j].addTransaction(transactions[i]);
                searchTo = 1;
                break;
            }
        }
        if (searchTo == 0) {
            let newPerson = new Person(transactions[i].to, negativeAmount);
            newPerson.addTransaction(transactions[i]);
            people.push(newPerson);
        }
    }
    return people;
}
let running = 1;
let people = [];
while (running) {
    let answer = rl.question('Give a command ');
    if (answer == "List All") {
        for (let i = 0; i < people.length; i++) {
            process.stdout.write(people[i].name);
            process.stdout.write(" ");
            process.stdout.write(people[i].money.toString());
            console.log();
        }
    }
    else if (answer == "Exit") {
        running = 0;
    }
    else {
        let text = answer.split(" ");
        if (text[0] == "List") {
            let name = answer.substring(5);
            console.log(name);
            for (let j = 0; j < people.length; j++) {
                if (people[j].name == name) {
                    process.stdout.write(people[j].name);
                    process.stdout.write(" ");
                    process.stdout.write(people[j].money.toString());
                    console.log();
                    console.log(people[j].transactions);
                    break;
                }
            }
        }
        else if (text[0] == "Add") {
            let name = answer.substring(4);
            if (fs_1.default.existsSync(name)) {
                if (name.match(/.+.csv/g)) {
                    let data_array = readCSVFile(name);
                    let transactions = parseDataArray(data_array);
                    people = evalTransactions(transactions);
                }
                else if (name.match(/.+.json/g)) {
                    let data_array = readJSONFile(name);
                    let transactions = parseDataArray(data_array);
                    people = evalTransactions(transactions);
                }
                else if (name.match(/.+.xml/g)) {
                    let data_array = readXMLFile(name);
                    let transactions = parseDataArray(data_array);
                    people = evalTransactions(transactions);
                }
            }
            else {
                logger.log("Error", "File doesnt exist");
            }
        }
    }
    logger.log("debug", "proba");
}
//let data_array = readFile("./DodgyTransactions2015.csv");
//let transactions = parseDataArray(data_array);
//let people = evalTransactions(transactions);
//# sourceMappingURL=index.js.map