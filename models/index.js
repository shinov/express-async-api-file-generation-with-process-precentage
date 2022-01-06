const fetch = require('node-fetch');
const path = require('path');

const { zips } = require("../util/zipCode");
const Excel = require('exceljs')

const createxls = async (data, vehicle) => {
    let workbook = new Excel.Workbook()
    let worksheet = workbook.addWorksheet('sheet 1');
    worksheet.columns = [
        {header: 'VIN', key: 'vin'},
        {header: 'DealerCode', key: 'dealerCode'},
        {header: 'EngineDesc', key: 'engineDesc'},
        {header: 'Exterior Color Desc', key: 'exteriorColorDesc'},
        {header: 'Transmission Desc', key: 'transmissionDesc'},
        {header: 'Status Code', key: 'statusCode'},
        {header: 'Vehicle Desc', key: 'vehicleDesc'},
        {header: 'MSRP', key: 'msrp'},
        {header: 'Destination Charge', key: 'destination'},
        {header: 'Code', key: 'code'}
    ];
    worksheet.getRow(1).font = {bold: true};
    worksheet.columns.forEach((column) => {
        if(column.key =="vin") {
            column.width = 18;
        } else  {
            column.width = column.header.length < 12 ? 12 : column.header.length
        }
    });
    data.forEach((e, index) => {
        // row 1 is the header.
        const rowIndex = index + 2
      
        // By using destructuring we can easily dump all of the data into the row without doing much
        // We can add formulas pretty easily by providing the formula property.
        worksheet.addRow({
          ...e
        })
      });
    const xlsPath = path.join(__dirname, `../public/xls/${vehicle}.xlsx`);

    return new Promise((resolve) => {
        workbook.xlsx.writeFile(xlsPath).then(() => {
            resolve({
                status: "success"
            });
        }).catch((e) => {
            resolve({
                e,
                status: "error"
            });
        });
    });
};


const getData = (vehicles = []) => {
    const returnArray = [];
    vehicles.forEach(v => {
        const temp = {
            vin: v?.vin,
            dealerCode: Number(v?.dealerCode),
            engineDesc: v?.engineDesc,
            exteriorColorDesc: v?.exteriorColorDesc,
            transmissionDesc: v?.transmissionDesc,
            statusCode: v?.statusCode,
            vehicleDesc: v?.vehicleDesc,
            msrp: Number(v?.price?.msrp),
            destination: Number(v?.price?.destination),
            code: v?.code
        }
        returnArray.push(temp);
    });
    return returnArray;
}

const getInventoryList = async (arg) => {
    const {
        vehicle,
        myEmitter
    } = arg;
  
    const data = await getInventoryData({
        vehicle,
        myEmitter
    });

    const uniqueRes = data.filter((value, index, self) => {
        return index === self.findIndex((t) => (
            t.vin === value.vin
        ))
    })
    const xlsStatus = await createxls(uniqueRes, vehicle);
    if(xlsStatus?.status === 'error') {
        return {
            data: 'error generating the xls'
        };
    } else {
        return {
            data: 'success generating the xls download from <a href="/xls/'+vehicle+'.xlsx" >here</a>'
        };
    }
}

const getInventoryData = async (arg) => {
    const {
        vehicle,
        myEmitter
    } = arg;
    console.log(vehicle);
    const count = zips.length;
    const zipArray = [];
    const result = [];
    await Promise.all(
        zips.map( async (zip) => {
            myEmitter.emit('progress', {
                status: "Fetching zip  data" + zip
            });
            await inventoryData({
                vehicle,
                zip
            }).then(e => {
                if (!zipArray[zip]) {
                    zipArray.push(zip);
                }
                if(e.length) {
                    result.push(...e);
                    myEmitter.emit('progress', {
                        status: "Success zip data " + zip,
                        progress: (zipArray.length * 100) / count
                    });
                } else {
                    myEmitter.emit('progress', {
                        status: "Failed zip data  " + zip,
                        errors: zip,
                        progress: (zipArray.length * 100) / count
                    });
                }
               
            });
        })
    );
    return result;
}

const inventoryData = (args) => {
    const {
        vehicle,
        zip='00001'
    } = args;

    if (!vehicle) {
        return Promise.resolve({
            error: true,
            msg: "no vehicle"
        });
    }

    let settings = {
        method: "GET",
    };
    const data = new Promise((resolve) => {
        const url = "http://localhost:3000/sample-data/"+vehicle+"/zip-"+zip+".json";
        console.log(url);
        fetch(url, settings).then(res => {
            if (res.ok) { // res.status >= 200 && res.status < 300
                try {
                    return res.json();
                } catch (e) {
                    resolve({
                        error: true,
                        msg: "Invalid Json",
                        reqParams: vehicle
                    });
                }
            } else {
                return null;
            }
        }).then((json) => {
            if (!json) {
                resolve({
                    error: true,
                    msg: "Invalid Json",
                    reqParams: vehicle
                });
            } else {
                const { result= {} } = json || {};
                const { data = {} } = result;
                const { vehicles = [] } = data;
                const res = getData(vehicles, vehicle);
                resolve(res);
            }
        }).catch(e => {
            Promise.resolve({
                error: true,
                reqParams: vehicle,
                e
            })
        });
    });
    return data;
}

exports.getInventoryList = getInventoryList;