// Definindo variáveis da lib
const fetch = require('cross-fetch')
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia, Buttons } = require('whatsapp-web.js');
const client = new Client({
    authStrategy: new LocalAuth()
});

// Variáveis da lógica do bot
const url = 'https://whatsapp-bot-e64db-default-rtdb.firebaseio.com/menu.json';
const commands = ['teste1', 'Iniciar pedido', 'Continuar pedindo', 'Adicionar observação', 'Finalizar pedido', 'Sim', 'Não', 'Vou pagar no pix'];
const payments = ['Pix/Dinheiro', 'Cartão', 'Ticket'];
var messageList = [];
var pizzas = [];
var drinks = [];
var itemsTicket = [];
var chatId = null;
var myOrder = null;
var ticket = null;
var obs = null;
var adress = null;
var delivery = 3;
var total = null;
var items = [];
var payMethod = null;
const pix = 'CPF: 000.000.000-00';
var moneyChange = null;

//Função para consumir a API Firebase
function getMenu() {
    fetch(url).then((response) => response.json()).then((data) => {
        pizzas = JSON.parse(JSON.stringify(data.pizzas))
        drinks = JSON.parse(JSON.stringify(data.bebidas));
        console.log("PIZZAS: ", pizzas);
        console.log("BEBIDAS: ", drinks);
    });

}

// Função para gerar o QR Code de Login
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

// Função para iniciar o cliente
client.on('ready', () => {
    console.log('Bot pronto!');
});

//Função para montar o ticket
function createCart(itemList, obs, adress, payment, moneyChange) {
    if (obs == null) {
        obs = 'Sem observações!'
    }

    if (moneyChange == null && payment == payments[0]) {
        payment = 'Pix - Chave pix:\n' + pix
        console.log("Sem troco")
    } else if(moneyChange != null && payment == payments[0]) {
        payment = moneyChange
    }
    
    for (var i = 0; i < itemList.length; i++) {
        items.push(itemList[i].name + ' - R$' + itemList[i].price);
        total += itemList[i].price;
    }

    if(payment == payments[0]) {
        payment = payment + ' - ' + 
        'Caso a forma de pagamento seja pix, mande o comprovante para podermos confirmar seu pedido.\n' +
        'Chave pix: ' + pix;  
    }
    
    total = total + delivery;
    ticket = '*SEU PEDIDO*\n\n' +
             '*Itens:*\n' +
             items.join('\n') + '\n\n' +
             '*Observações:* ' + obs + '\n' +
             '\n*Endereço de entrega:*\n' + adress + '\n\n' +
             '*Forma de pagamento:* ' + payment + '\n' +
             '*Taxa de entrega:* R$ ' + delivery + '\n\n' +
             '*Entrega entre 30~50 minutos*\n' +
             '\n*TOTAL:* R$ ' + total;
    console.log(ticket)
    return ticket; 
}

// Função para iniciar o chat
function startChat() {

    client.on('message', async message => {
        const chat = await message.getChat();
        const menu = await MessageMedia.fromFilePath('./Cardapio.png');

        if (message.body == commands[0] && messageList.length == 0) {
            chatId = chat.id.user;
            let button = new Buttons('🤖 Olá, bem-vindo(a) ao nosso auto-atendimento! Clique para iniciar seu pedido.', [{ body: commands[1] }], '', '');
            client.sendMessage(message.from, button);
        }

        if (message.body == commands[1] && chat.id.user == chatId) {
            chat.sendMessage(menu, { caption: 'Para adicionar um item ao seu pedido, informe o número de identificação dele. Ex: *01* - Pizza de Mussarela' });
        }

        if (message.body == commands[2] && chat.id.user == chatId) {
            chat.sendMessage("Informe o número de identificação do item que deseja adicionar. Ex: *01* - Pizza de Mussarela");
        }

        if (message.body == commands[3] && chat.id.user == chatId) {
            chat.sendMessage("Qual é a sua observação?");
        }

        if (message.body == commands[4] && chat.id.user == chatId) {
            chat.sendMessage("Nos informe seu endereço, número e complemento.");
        }

        if (chat.id.user == chatId && message.body != commands[0, 1]) {
            pizzas.find(item => {
                if (item.id == message.body) {
                    myOrder = item
                    itemsTicket.push(myOrder);
                    console.log("seu pedido: ", itemsTicket);
                    let button = new Buttons(
                        '*Item adicionado ao carrinho:*' + '\n'
                        + myOrder.name + '\n'
                        + 'Valor: R$ ' + myOrder.price,
                        [{ body: commands[2] }, { body: commands[3] }, { body: commands[4] }], '', '');
                    client.sendMessage(message.from, button);
                    
                }
            });

            drinks.find(item => {
                if (item.id == message.body) {
                    myOrder = item
                    itemsTicket.push(myOrder);
                    console.log("seu pedido: ", itemsTicket);
                    let button = new Buttons(
                        '*Item adicionado ao carrinho:*' + '\n'
                        + myOrder.name + '\n'
                        + 'Valor: R$ ' + myOrder.price,
                        [{ body: commands[2] }, { body: commands[3] }, { body: commands[4] }], '', '');
                    client.sendMessage(message.from, button);
                }
            })
            
        }

        if (message.body != commands && chat.id.user == chatId && messageList.slice(-1) == commands[3]) {
            let button = new Buttons(
                'Como gostaria de prosseguir?',
                [{ body: commands[2] }, { body: commands[4] }], '', '');

            if (message.body != commands[3]) { obs = message.body; }
            if (obs != null) { client.sendMessage(message.from, button); }
        }

        if (message.body != commands && chat.id.user == chatId && messageList.slice(-1) == commands[4] && messageList.length >= 1) {
            let button = new Buttons(
                'Qual seria a forma de pagamento?',
                [{ body: payments[0] }, { body: payments[1] }, { body: payments[2] }], '', '');

            if (message.body != commands[4]) { adress = message.body; }
            if (adress != null) {
                client.sendMessage(message.from, button);
            }
            
        }

        messageList.push(message.body);
        console.log(messageList.length);

        if (message.body != payments && chat.id.user == chatId && messageList.slice(-1) == payments[1] || messageList.slice(-1) == payments[2]){
            payMethod = message.body;
            chat.sendMessage(createCart(itemsTicket, obs, adress, payMethod));
        }

        if (message.body != payments && chat.id.user == chatId && messageList.slice(-1) == payments[0]) {
            payMethod = message.body;
            
            let button = new Buttons(
                'Precisa de troco?',
                [{ body: commands[5] }, { body: commands[6]}, { body: commands[7]}], '', '');

            client.sendMessage(message.from, button);
        }

        if (message.body != payments && chat.id.user == chatId && messageList.slice(-1) == commands[5]) {
            chat.sendMessage("Troco para quanto? (Por favor, informar somente o valor)");
        }

        if (chat.id.user == chatId || messageList.length > 6) {
            moneyChange = 'Dinheiro - Troco para ' + message.Body;
            chat.sendMessage(createCart(itemsTicket, obs, adress, payMethod, moneyChange));
            console.log("Troco: " + message.body)
        }

    })
}

getMenu();
startChat();
client.initialize();