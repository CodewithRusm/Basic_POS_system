// VARIABLES
const barcodeInput = document.getElementById('barcode');
const quantity = document.getElementById('quantity');
const tbody = document.getElementById('cartBody');
const qty = document.getElementById('quantity');
const total = document.getElementById('total');
const payBtn = document.getElementById('payBtn');
const closeBtn = document.getElementById('closeBtn');
const editCloseBtn = document.getElementById('close');
const overlay = document.getElementById('overlay');
const editOverlay = document.getElementById('edit-overlay');
const amount = document.getElementById('amountToPay');
const money  = document.getElementById('amountPaid');
const pay = document.getElementById('submitPayment');
const edit = document.getElementById('submitEdit');
const empty = document.getElementById('empty-row');
const editInput = document.getElementById('editInput');

let timeId; //store the id of the inputted barcode
let totalPrice = 0; // STORAGE FOR THE OVERALL TOTAL
let rowCount = 0; // FOR DISPLAYING THE MESSAGE IF THE ROW DATA IS EMPTY
let primaryId = 0; // FOR REMOVING THE ROW, USING THE ID
let editId; // FOR EDIT TO DETERMINE WHAT ROW SHOULD THE CHANGES APPLY

// DISPLAY EMPTY MESSAGE
show();

// GET THE BARCODE AND SHOW THE DATA
barcodeInput.addEventListener('input', (e) => {
    e.preventDefault();
    clearTimeout(timeId); // decline the previous barcode and accept new instead preventing mix of barcode

    /* this says like after 200ms which is fast, display the code inside the setTimeout,
     enabling the barcode disappear in input and display data below at the same time the barcode disappear */
    timeId = setTimeout(() => {
        sendBarcode(barcodeInput.value);
        barcodeInput.value = ''; // empty the input bar to scan again
    }, 200); // delay time
});

// OPEN PAYMENT
payBtn.addEventListener('click', () => {
    if (rowCount === 0){
        alert('No purchased yet! Please purchased to open it.');
        return;
    }
    const formattedPrice = totalPrice.toFixed(2);
    amount.textContent = '$'+formattedPrice;
    overlay.classList.add('active');
});

// CLOSE PAYMENT
closeBtn.addEventListener('click', () => {
    overlay.classList.remove('active');
    money.value = '';
});

//  SUBMIT PAYMENT
pay.addEventListener('click', () => {
    const formattedPrice = totalPrice.toFixed(2);
    const customerMoney = parseFloat(money.value);

    if (customerMoney < formattedPrice){ // check if money is enough
        money.value = '';
        return alert('Not enough money!');
    }
    // ENOUGH MONEY
    const change =  money.value - formattedPrice;
    alert('     Paid successfully! \n     Change: $'+change+'\n     Thank you for purchasing!');
    overlay.classList.remove('active');
    money.value = '';
    total.value = '$0.00';
    // DELETE ALL ROWS
    const rows = document.querySelectorAll('table tbody tr');
    rows.forEach( row => {
        row.remove();
        rowCount = 0;
    });
    // SHOW THE EMPTY MESSAGE SINCE ITS ALL PAID OFF
    show();
});

// GET QUANTITY TO EDIT
document.body.addEventListener('click', (e) => {
    if(e.target.matches('.edit-btn')){
        e.preventDefault();
        const id = e.target.closest('tr').dataset.id; // get the id of the item to removed
        editId = id;
        const row = document.querySelector(`tr[data-id='${id}']`); // get the row data
        const itemQty = row.querySelector('#quantity'); // for decreasing the totalPrice once an item removed
        editInput.value = itemQty.textContent;
        editOverlay.classList.add('active'); // OPEN THE EDIT MODAL AND SHOW THE QUANTITY
    }
});

// CLOSE EDIT
editCloseBtn.addEventListener('click', () => {
    editOverlay.classList.remove('active');
});

// SUBMIT EDIT
edit.addEventListener('click', (e) => {
        e.preventDefault();
        const row = document.querySelector(`tr[data-id='${editId}']`); // get the row data to edit
        const itemQty = row.querySelector('#quantity'); // GET THE QUANTITY
        const subTotal = row.querySelector('#subtotal'); // CALL SUBTOTAL FOR CHANGING VALUE
        const itemPrice = row.querySelector('#price');
        // GET OLD AND NEW QUANTITY
        const oldQty = parseFloat(itemQty.textContent);
        const newQty = editInput.value;
        //SET THE NEW QUANTITY
        itemQty.textContent = newQty;
        // GET THE NEW SUBTOTAL
        let subtotal = parseFloat(itemQty.textContent) * parseFloat(itemPrice.value);
        // SET THE NEW TOTAL IF THE QUANTITY IS CHANGED
        if (newQty > oldQty && newQty != 0){ // IF NEW IS GREATER THAN OLD
            let diff = newQty - oldQty; // GET THE DIFFERENCE OF THE CHANGED QTY FROM OLD TO NEW ONE
            let diffPrice = diff * parseFloat(itemPrice.value); // MULTIPLY THE DIFFERENCE BY THE PRICE
            totalPrice += diffPrice; // ADD THE DIFFERENCE PRICE TO THE CURRENT TOTAL
        }else{
            let diff = oldQty - newQty;
            let diffPrice = diff * parseFloat(itemPrice.value);
            totalPrice -= diffPrice;
        }
        // SET THE NEW VALUE
        subTotal.textContent = '$'+subtotal.toFixed(2);
        subTotal.value = subtotal.toFixed(2);
        const formattedPrice = totalPrice.toFixed(2);
        total.value = '$'+formattedPrice;
        alert('Edit successful.');
        editOverlay.classList.remove('active'); // CLOSE THE MODAL AFTER THE MESSAGE SHOW
});

// REMOVE
document.body.addEventListener('click', (e) => {
    if(e.target.matches('.remove-btn')){
        e.preventDefault();
        const id = e.target.closest('tr').dataset.id; // get the id of the item to removed
        const row = document.querySelector(`tr[data-id='${id}']`); // get the row data
        const tdAmount = row.querySelector('#subtotal'); // for decreasing the totalPrice once an item removed
        console.log('sub:'+tdAmount.value);
        if (row){ // check if there is a result
            row.remove(); // remove the row data
            rowCount -= 1;
            totalPrice -= parseFloat(tdAmount.value);
            const formattedPrice = totalPrice.toFixed(2);
            total.value = '$'+formattedPrice;
        }

        if(rowCount <= 0) show(); // if all row are deleted show an empty message
    }
});

// FETCH THE BARCODE INFO IN THE DB
async function sendBarcode(barcode){
    try{
        const response = await fetch('/home/product-data', {
             method: 'POST',
             headers: {'Content-Type':'application/json'},
             body: JSON.stringify({barcode:barcode})
        });
        if (!response.ok) throw new Error(response.message);

        const result = await response.json();

        if (result.success){
            empty.remove();

            // GET THE PRICE
            itemPrice = result.data.price;
            const totalQty = parseFloat(qty.value); // GET THE QUANTITY

            // CHECK TOTAL QTY AND GET THE TOTAL
            totalPrice += totalQty * itemPrice; //for overall total

            // TOTAL PRICE FORMATTED
            const formattedPrice = totalPrice.toFixed(2); // get the price in 2 decimal place

            // CREATE A TR
            primaryId += 1;
            const tr = document.createElement('tr');
            tr.dataset.id = primaryId;
            console.log('idAdded:'+tr.dataset.id);

            // CREATE TD AND ADD DATA ON EACH 12345
            let subtotal = 0; //get subtotal
            if (totalQty != 1){
                subtotal = totalQty * itemPrice;
            }else{
                subtotal = itemPrice;
            }

            const datas = {
                'barcode': result.data.barcode,
                'product_name': result.data.product_name,
                'price': '$'+result.data.price.toFixed(2),
                'quantity': qty.value,
                'subtotal': '$'+subtotal.toFixed(2) // format
            };

            const keys = Object.keys(datas); // get the keys of datas like barcode, product_name, etc.
            for(let i = 0; i < keys.length + 1; i++){
                const td = document.createElement('td');

                if (i === keys.length){
                    const removeBtn = document.createElement('button');
                    const editBtn = document.createElement('button');
                    removeBtn.setAttribute('id', 'remove-btn');
                    removeBtn.className = 'remove-btn';
                    removeBtn.textContent = 'Remove';
                    editBtn.setAttribute('id', 'edit-btn');
                    editBtn.className = 'edit-btn';
                    editBtn.textContent = 'Edit';

                    td.append(editBtn, removeBtn);
                }else{
                    td.setAttribute('id', keys[i]);
                    td.textContent = datas[keys[i]];
                    if (keys[i] === 'subtotal') td.value = subtotal.toFixed(2);
                    if (keys[i] === 'price') td.value = result.data.price.toFixed(2);
                }
                tr.appendChild(td);
            }

            // DISPLAY ALL DATA INTO FRONTEND
            total.value = '$'+formattedPrice; // put the price
            tbody.appendChild(tr);
            rowCount += 1;
            qty.value = 1; // set back to 1 for one item purchased only and to avoid typing manually if its one item
        }else{
            alert(result.message);
        }
    }catch(error){
        alert(result.message);
    }
}

// SHOW AN EMPTY MESSAGE
function show(){
    // if there is no tr in the tbody it will add
    if (tbody.children.length === 0){
        tbody.appendChild(empty); // if you create the tr in html and then you remove it you dont need to create again since the code is on the html and not remove
    }
}
