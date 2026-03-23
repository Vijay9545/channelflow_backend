import qs from 'qs';

const multerBody = {
    'variants[distributor][price]': '100',
    'variants[distributor][mrp]': '200',
    'variants[distributor][qty]': '0',
    'variants[distributor][miniOrderQty]': '47',
    'priceTiers[0][minQty]': '100',
    'priceTiers[0][price]': '2',
    'title': 'sdfsdfs'
};

const fixedBody = qs.parse(qs.stringify(multerBody));

console.log(JSON.stringify(fixedBody, null, 2));
