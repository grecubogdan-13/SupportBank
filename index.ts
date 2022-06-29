import fs from "fs";
const log4js = require("log4js");
const logger = log4js.getLogger("Transactions");

log4js.configure({
    appenders: {
        file: { type: 'fileSync', filename: 'logs/debug.log' }
    },
    categories: {
        default: { appenders: ['file'], level: 'debug'}
    }
});

let rl = require('readline-sync');

class Record {
    date: string = "";
    from: string = "";
    to: string = "";
    narrative: string = "";
    sum: number = 0;

    constructor(date:string, from:string, to:string, narrative:string, sum:number) {
        this.date = date;
        this.from = from;
        this.to = to;
        this.narrative = narrative;
        this.sum = sum;
    }

}

class Person {
    money: number = 0;
    name: string = "";
    transactions: Record[] = [];

    constructor(name: string,money: number) {
        this.name = name;
        this.money = money;
    }

    transaction(sum: number) {
        this.money = this.money + sum;
    }

    addTransaction(transaction: Record){
        this.transactions.push(transaction);
    }
}

function readCSVFile(filename: string){
    let fs = require("fs");
    let textByLine = fs.readFileSync(filename).toString().split("\r\n");
    let res = textByLine.map((line: string) => line.split(","));
    res = res.slice(1);
    return res;
}

function readJSONFile(filename: string){
    let fs = require("fs");
    let transactions = JSON.parse(fs.readFileSync(filename).toString());
    let transactionsString = transactions.map((transaction: any) => {
        let transactionString: string[] = [];
        console.log(transaction);
        transactionString.push(transaction["Date"]);
        transactionString.push(transaction["FromAccount"]);
        transactionString.push(transaction["ToAccount"]);
        transactionString.push(transaction["Narrative"]);
        transactionString.push(transaction["Amount"]);
        return transactionString;
    });
    return transactionsString;
}

function readXMLFile(filename: string){
    let fs = require("fs");
    let transactions = fs.readFileSync(filename).toString();
    const {XMLParser} = require('fast-xml-parser');
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_"
    });
    let parsedData = parser.parse(transactions);
    let transactionsList = parsedData.TransactionList.SupportTransaction;
    let transactionsString = transactionsList.map((transaction: any) => {
        let transactionString: string[] = [];
        let msInADay = 86400000;
        let daysBetween1900And1970 = 25568;
        let parsedDate = new Date( (parseInt(transaction["@_Date"]) - daysBetween1900And1970) * msInADay);
        transactionString.push(parsedDate.toString());
        transactionString.push(transaction.Parties.From);
        transactionString.push(transaction.Parties.To);
        transactionString.push(transaction.Description);
        transactionString.push(transaction.Value.toString());
        return transactionString;
    });
    return transactionsString;
}

function parseDataArray(data_array: string[][]){
    let records = data_array.map((element: any) => {
        let index = data_array.indexOf(element) + 1;
        let date = element[0];
        let dateOkCSV = date.match(/[0-9].[0-9].\/[0-9].[0-9].\/[0-9].[0-9].[0-9].[0-9]./g);
        let dateOkJSON = date.match(/[0-9].[0-9].[0-9].[0-9].-[0-9].[0-9]-[0-9].[0-9].T[0-9].[0-9].:[0-9].[0-9].:[0-9].[0-9]./g);
        let dateOkXML = date.match(/[A-Z].[a-z].[a-z]. [A-Z].[a-z].[a-z]. [0-9].[0-9]. [0-9].[0-9].:[0-9].[0-9].:[0-9].[0-9]. GMT\+0100 \(British Summer Time\)/g);
        if(!dateOkCSV && !dateOkJSON && !dateOkXML){
            logger.log("Error","Wrong Date, check line " + index);
        }
        let to = element[1];
        let from = element[2];
        let narrative = element[3];
        if(isNaN(parseFloat(element[4]))){
            logger.log("Error","Invalid Amount, check line " + index);
        }
        let sum = parseFloat(element[4]);
        let record = new Record(date,to,from,narrative,sum);
        return record;
    });
    return records;
}

function evalTransactions(transactions: Record[]){
    let people: Person[] = [];
    transactions.forEach((transaction: any) =>{
        let negativeAmount = transaction.sum * (-1);
        let searchFrom = people.filter((person: any) => transaction.from === person.name);
        if(searchFrom.length === 0){
            let newPerson = new Person(transaction.from,negativeAmount);
            newPerson.addTransaction(transaction);
            people.push(newPerson);
        }
        else {
            let indexOfFrom = people.indexOf(searchFrom[0]);
            people[indexOfFrom].transaction(negativeAmount);
            people[indexOfFrom].addTransaction(transaction);
        }
        let searchTo = people.filter((person: any) => transaction.to === person.name);
        if(searchTo.length === 0){
            let newPerson = new Person(transaction.to,transaction.sum);
            newPerson.addTransaction(transaction);
            people.push(newPerson);
        }
        else {
            let indexOfTo = people.indexOf(searchTo[0]);
            people[indexOfTo].transaction(transaction.sum);
            people[indexOfTo].addTransaction(transaction);
        }
    });
    return people;
}

let running = 1;
let people: Person[] = [];

while(running){
    let answer = rl.question('Give a command ');
    if(answer === "List All"){
        people.forEach((person: any) => {
            process.stdout.write(person.name);
            process.stdout.write(" ");
            process.stdout.write(person.money.toString());
            console.log();
        });
    }
    else if(answer === "Exit"){
        running = 0;
    }
    else {
        let text = answer.split(" ");
        if(text[0] === "List"){
            let name = answer.substring(5);
            console.log(name);
            let foundPerson = people.filter((person: any) => person.name === name);
            if (foundPerson.length === 0) {
                logger.log("Warning","User not found");
            }
            else {
                process.stdout.write(foundPerson[0].name);
                process.stdout.write(" ");
                process.stdout.write(foundPerson[0].money.toString());
                console.log();
                console.log(foundPerson[0].transactions);
            }
        }
        else if(text[0] === "Add") {
            let name = answer.substring(4);
            if(fs.existsSync(name)) {
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
                logger.log("Error","File doesnt exist");
            }
        }
    }
    logger.log("Debug","Ok") ;
}
