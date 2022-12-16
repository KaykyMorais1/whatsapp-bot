// Definindo variáveis da lib
const fetch = require('cross-fetch')
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia, Buttons } = require('whatsapp-web.js');
const client = new Client({
    authStrategy: new LocalAuth()
});

// Variáveis da lógica do bot
const url = 'https://whatsapp-bot-e64db-default-rtdb.firebaseio.com/menu.json';
var commands = ['teste1', 'Iniciar pedido', 'Continuar pedindo', 'Adicionar observação', 'Finalizar pedido'];
var payments = ['Pix/Dinheiro', 'Cartão', 'Ticket'];
var messageList = [];
var pizzas = [];
var drinks = [];
var itemsTicket = [];
var chatId = null;
var myOrder = null;
var ticket = null;
var obs = null;
var adress = null;

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

// Função para adicionar um item ao pedido
function showCart(item, obs, adress) {
    
    console.log("OBS: ", obs);
    console.log("ENDEREÇO: ", adress);
    const carrinho = '*SEU PEDIDO*\n' + 
                     '\n ITENS: ' + item.name + '\n' + 
                     '\nObservação: ' + obs +
                     'Total: '
    return carrinho;
}

//Função para montar o ticket
async function addCart(item) {
    itemsTicket.push(item);

}

// Função para iniciar o chat
function startChat() {

    client.on('message', async message => {
        const chat = await message.getChat();
        const menu = await MessageMedia.fromFilePath('./Cardapio.png');

        if (message.body == commands[0]) {
            chatId = chat.id.user;
            let button = new Buttons('Olá, bem-vindo(a) ao nosso auto-atendimento!', [{ body: commands[1] }], '', '');
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
            messageList.push(message.body);
        }

        if (message.body == commands[4] && chat.id.user == chatId) {
            chat.sendMessage("Nos informe seu endereço, número e complemento.")
            messageList.push(message.body);
        }

        if (chat.id.user == chatId && message.body != commands[0, 1]) {
            pizzas.find(item => {
                if (item.id == message.body) {
                    myOrder = item
                    itemsTicket.push(myOrder);
                    console.log("seu pedido: ", myOrder);
                    let button2 = new Buttons(
                        'Seu pedido até o momento:' + '\n'
                        + myOrder.name + '\n'
                        + 'TOTAL: R$' + myOrder.price,
                        [{ body: commands[2] }, { body: commands[3] }, { body: commands[4] }], '', '');
                    client.sendMessage(message.from, button2);
                }
            });

            drinks.find(item => {
                if (item.id == message.body) {
                    myOrder = item
                    console.log("seu pedido: ", myOrder);
                    let button2 = new Buttons(
                        'Seu pedido até o momento:' + '\n'
                        + myOrder.name + '\n'
                        + 'TOTAL: R$' + myOrder.price,
                        [{ body: commands[2] }, { body: commands[3] }, { body: commands[4] }], '', '');
                    client.sendMessage(message.from, button2);
                }
            })

        }

        if (message.body != commands && chat.id.user == chatId && messageList.slice(-1) == commands[3] && messageList.length >= 1) {
            let button3 = new Buttons(
                'Como gostaria de prosseguir?',
                [{ body: commands[2] }, { body: commands[4] }], '', '');

            if (message.body != commands[3]) { obs = message.body; }

            if (obs != null) {
                //showCart(myOrder, obs);
                client.sendMessage(message.from, button3);
            } else {
                obs = 'Sem observação';
                //showCart(myOrder, obs);
                client.sendMessage(message.from, button3);
            }

            messageList.push(message.body);
        }

        if (message.body != commands && chat.id.user == chatId && messageList.slice(-1) == commands[4] && messageList.length >= 1) {
            let button4 = new Buttons(
                'Qual seria a forma de pagamento?',
                [{ body: payments[0] }, { body: payments[1] }, { body: payments[2] }], '', '');

            if (message.body != commands[4]) { adress = message.body; }
            if (adress != null) {
                //showCart(myOrder, obs, adress);
                client.sendMessage(message.from, button4);
            }
            messageList.push(message.body);
        }

        if (myOrder != null && adress != null) {
            if (obs == null) {
                obs = 'Sem observação';
            }
            

            console.log(showCart(myOrder, obs, adress));
            chat.sendMessage(showCart(myOrder, obs, adress));
        }

    })
}

getMenu();
startChat();
client.initialize();