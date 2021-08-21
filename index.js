const Discord = require('discord.js');
const { MessageEmbed } = require('discord.js');
const client = new Discord.Client();
const prefix = '$';
const fs = require('fs');
const channelID = "875437925184204811";
const userID = "490975371567562760"; //pajPaj 490975371567562760  //kisel 543470689173241876

if (!fs.existsSync("products.json")) fs.writeFileSync('products.json', "{}");
if (!fs.existsSync("orders.json")) fs.writeFileSync('orders.json', '{"orders":[], "lastNr":0}');
let products = JSON.parse(fs.readFileSync('products.json'));
let orders = JSON.parse(fs.readFileSync('orders.json'))

client.on("error", (e) => console.error(e));
client.on("warn", (e) => console.warn(e));

client.once('ready', () => {
    console.log('OrderBot is online!');
});

client.on('message', msg =>{
    if (msg.channel.id != msg.guild.channels.cache.get(channelID) && msg.content.startsWith(prefix)) {
      msg.reply(`Komend używaj na ${msg.guild.channels.cache.get(channelID).toString()}`);
      return ;
    }
    products = JSON.parse(fs.readFileSync('products.json'));
    orders = JSON.parse(fs.readFileSync('orders.json'));
    //functions
    const getMeasage = function() {return msg.content.toLowerCase()}
    const getCommand = function() {return msg.content.split(" ")}
    const send = function(txt) {msg.author.send(txt);}
    const noPermision = msg.member.roles.cache.some(r => r.name === "klient");
    console.log(noPermision);

    if (getCommand()[0] == `${prefix}delivery`) send(delivery(getCommand(),noPermision));
    if (getCommand()[0] == `${prefix}finishOrder`) send(finishOrder(getCommand(),noPermision));
    if (getCommand()[0] == `${prefix}createProduct`) send(add(getCommand(),noPermision));
    if (getCommand()[0] == `${prefix}showOrders`) showOrders(msg,noPermision);
    if (getCommand()[0] == `${prefix}clearProducts`) send(clear(noPermision));
    if (getCommand()[0] == `${prefix}orderToMake`) send(olderOrder(noPermision));
    if (getCommand()[0] == `${prefix}deleteProduct`) send(delProduct(noPermision,getCommand()));
    if (getCommand()[0] == `${prefix}showProducts`) showProducts(msg);
    if (getCommand()[0] == `${prefix}order`) send(order(getCommand(), msg.author.username));
    msg.channel.bulkDelete(1, true);
    fs.writeFileSync('products.json', JSON.stringify(products));
    fs.writeFileSync('orders.json', JSON.stringify(orders));
});

const delivery = function(args, p) {
  if (p) return "jako klient nie możesz kożystać z tej komendy";
  if (args.length > 4 || args.length < 3) {
    return "delivery [produkt] [ilość] [cena to w przypadku zmiany ceny produktu]";
  }else if (parseFloat(args[2]) == 0 && !args[3]) {
    return "Nie możesz dodać 0 produktu, jaki to ma sens? XD"
  }else if (!parseFloat(args[2]) > 0) {
    return parseFloat(args[2]) + " nie jest liczbą";
  }else if (!isInt(parseFloat(args[2]))) {
    return args[2] + " wtf, jak mam ci kude dodać ułamek do rzeczy w magazynie!?"
  }else if (products[args[1]].quantity + parseFloat(args[2]) < 0) {
    return "oj nie nie " + (products[args[1]].quantity+parseFloat(args[2]))+ " " +args[1] + " tak to sie nie bawimy XD"
  }else if (!products.hasOwnProperty(args[1]) && args.length == 3) {
    return "Produkt nie istnieje"
  }else if (parseFloat(args[3]) == 0) {
    return "Chesz to dać za darmo!?"
  }else if (!parseFloat(args[3]) > 0 && args[3]) {
    return  args[3] + " to nie liczba"
  }else if (parseFloat(args[3]) < 0) {
    return "Możesz zabrać produty ustawiając liczb ujemnych, ale ceny ujemnej to ci nie pozwole dać";
  }else if (!products.hasOwnProperty(args[1])) {
    return "Produkt nie istnieje"
  }else{
    products[args[1]].quantity+=parseFloat(args[2]);
    if (args[3]) {
      products[args[1]].price=parseFloat(args[3]);
    }
    return productEmbed(products[args[1]]);
  }
}

const finishOrder = function(args, p) {
    if (p) return "jako klient nie możesz kożystać z tej komendy";
  if (args.length != 2) {
    return "finishOrder [nr_zamówienia]";
  }else if (!parseInt(args[1]) > 1){
    return "number zamówienia to liczba"
  }else{
    let ordersArray = orders.orders;
    let exist = false;
    let index = 0;
    for (var i = 0; i < ordersArray.length; i++) {
      if (ordersArray[i].nr == parseInt(args[1])) {
        index = i;
        exist = true;
        break;
      }
    }
    if (exist) {
      ordersArray.splice(index, 1);
      return "ununięto z listy zamówień"
    }else{
      return "zamówienie o takim numerze nie istnieje";
    }
  }
}

const add = function(args, p) {
  if (p) return "jako klient nie możesz kożystać z tej komendy";
  if (args.length != 3) {
    return "createProduct [produkt] [cena]";
  }else if (parseFloat(args[2]) == 0) {
    return "Chesz to dać za darmo!?"
  }else if (!parseFloat(args[2]) > 0) {
    return  args[2] + " to nie liczba"
  }else if (parseFloat(args[2]) < 0) {
    return "kude liczby dodatnie kude, jak ktoś to kupi to masz mu jeszcze zapłacis za kupno kude";
  }else if (products.hasOwnProperty(args[1])) {
    return "Produkt już istnieje";
  }else{
    products[args[1]] = {
      "name":args[1],
      "quantity":0,
      "price":parseFloat(args[2])
    };
    return productEmbed(products[args[1]]);
  }
}

const showProducts = function(msg) {
  if (Object.keys(products).length > 0) {
    let productsNames = Object.keys(products);
    for (var i = 0; i < productsNames.length; i++) {
      let product = products[productsNames[i]]
      msg.author.send(productEmbed(product))
    }
    return ;
  }else{
    msg.author.send("brak danych");
  }
}

const showOrders = function(msg, p) {
  if (p) return "jako klient nie możesz kożystać z tej komendy";
  let ordersArray = orders.orders;
  if (ordersArray.length > 0) {
    for (var i = 0; i < ordersArray.length; i++) {
      msg.author.send(orderEmbed(ordersArray[i]))
    }
    return ;
  }else{
    msg.author.send("brak zamówień");
  }
}

const clear = function(p) {
  if (p) return "jako klient nie możesz kożystać z tej komendy";
  products = {};
  return "wyczyszczono liste produktów"
}

const order = function(args, username) {
  if (args.length != 4) {
    return "order [produkt] [ilość] [adres_zamieszkania]";
  }else if (!products.hasOwnProperty(args[1])) {
    return "Produkt nie istnieje";
  }else if (parseFloat(args[2]) == 0) {
    return "Nie możesz kupić 0 produktu, jaki to ma sens? XD"
  }else if (!parseFloat(args[2]) > 0) {
    return args[2] + "nie jest liczbą";
  }else if (!isInt(parseFloat(args[2]))) {
    return args[2] + " wtf, ułamek"
  }else if (products[args[1]].quantity < parseFloat(args[2])) {
    return "nie mamy tyle w magazynie";
  }else{
    const order = {'name': username, 'product': args[1], 'quantity': parseInt(args[2]), 'price':parseInt(args[2]) * products[args[1]].price, "adres": args[3], 'nr': orders.lastNr+1};
    products[args[1]].quantity -= parseFloat(args[2]);
    orders.lastNr +=1;
    orders.orders.push(order);
    const exampleEmbed = orderEmbed(order);
       client.users.fetch(userID, false).then((user) => {
         user.send(exampleEmbed);
       });
       client.users.fetch("543470689173241876", false).then((user) => {
         user.send(exampleEmbed);
       });
       return exampleEmbed
  }
}

const olderOrder = function(p) {
  if (p) return "jako klient nie możesz kożystać z tej komendy";
  if (orders.orders[0] != null) {
    return orderEmbed(orders.orders[0]);
  }else{
    return "brak zamówień"
  }
}

const delProduct = function(p, args) {
  if (p) return "jako klient nie możesz kożystać z tej komendy";
  if (args.length != 2) {
    return "deleteProduct [produkt]";
  }else if (!products.hasOwnProperty(args[1])) {
    return "produkt nie istnieje"
  }else{
    delete products[args[1]]
    return "ununięto "+args[1] + " z listy produktów";
  }
}

const isInt = function(n) {
  return parseInt(n) == n;
};

const orderEmbed = function(order) {
  const exampleEmbed = new MessageEmbed()
   .setColor('#0099ff')
   .setTitle(order.name)
   .addFields(
       { name: 'Klient:', value: order.name, inline: true },
       { name: 'Gdzie dostarczyć:', value: order.adres, inline: true },
       { name: 'Kupił:', value: order.product, inline: true },
       { name: 'Sztuk:', value: order.quantity, inline: true },
       { name: 'Cena:', value: order.price + "pln", inline: true },
       { name: 'nr Zamówienia:', value: order.nr, inline: true },
     );
     return exampleEmbed;
}

const productEmbed = function (obj) {
  const exampleEmbed = new MessageEmbed()
   .setColor('#0099ff')
   .setTitle(obj.name)
   .addFields(
       { name: 'Nazwa:', value: obj.name, inline: true },
       { name: 'W magazynie:', value: obj.quantity, inline: true },
       { name: 'Cena:', value: obj.price + "pln", inline: true },
     );
     return exampleEmbed
};

client.login(JSON.parse(fs.readFileSync('token.txt', 'utf8')));
