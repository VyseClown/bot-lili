module.exports = async (client) => {
    now = new Date();
    var dia = now.getDate();
    var mes = now.getMonth();
    var ano4 = now.getFullYear();
    var seg = now.getSeconds();
    var min = now.getMinutes();
    var hora = now.getHours();
    var str_hora = hora + ":" + min + ":" + seg;
    var str_data = dia + "/" + (mes + 1) + "/" + ano4;
    console.log(
        `[SOURCE] CONNECTED LIKE ${client.user.username} | ${str_data} ${str_hora}`
    );
};