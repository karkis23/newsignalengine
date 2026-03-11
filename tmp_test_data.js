import axios from 'axios';

async function testData() {
    const sheetId = '1aTMH5Yz28X_NA6lZgtjQzc7jlu9hiAPVVuf1ASTBQoU';
    const GID = {
        signals: 0,
        tradeSummary: 2086062684,
    };

    const fetchSheet = async (gid) => {
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        const { data } = await axios.get(url);
        return data;
    };

    const signalsCsv = await fetchSheet(GID.signals);
    const summaryCsv = await fetchSheet(GID.tradeSummary);

    console.log('Signals CSV first lines:');
    console.log(signalsCsv.split('\n').slice(0, 5).join('\n'));

    console.log('\nSummary CSV first lines:');
    console.log(summaryCsv.split('\n').slice(0, 5).join('\n'));
}

testData();
