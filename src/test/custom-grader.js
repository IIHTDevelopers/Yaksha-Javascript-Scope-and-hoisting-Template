const esprima = require('esprima');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const xmlBuilder = require('xmlbuilder');

// Define TestCaseResultDto
class TestCaseResultDto {
    constructor(methodName, methodType, actualScore, earnedScore, status, isMandatory, errorMessage) {
        this.methodName = methodName;
        this.methodType = methodType;
        this.actualScore = actualScore;
        this.earnedScore = earnedScore;
        this.status = status;
        this.isMandatory = isMandatory;
        this.errorMessage = errorMessage;
    }
}

// Define TestResults
class TestResults {
    constructor() {
        this.testCaseResults = {};
        this.customData = '';  // Include custom data from the file
    }
}

// Function to read the custom.ih file
function readCustomFile() {
    let customData = '';
    try {
        customData = fs.readFileSync('../custom.ih', 'utf8');
    } catch (err) {
        console.error('Error reading custom.ih file:', err);
    }
    return customData;
}

// Function to send test case result to the server
async function sendResultToServer(testResults) {
    try {
        const response = await axios.post('https://compiler.techademy.com/v1/mfa-results/push', testResults, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('Server Response:', response.data);
    } catch (error) {
        console.error('Error sending data to server:', error);
    }
}

// Function to generate the XML report
function generateXmlReport(result) {
    const xml = xmlBuilder.create('test-cases')
        .ele('case')
        .ele('test-case-type', result.status)
        .up()
        .ele('name', result.methodName)
        .up()
        .ele('status', result.status)
        .up()
        .end({ pretty: true });
    return xml;
}

// Function to write to output files
function writeOutputFiles(result, fileType) {
    const outputFiles = {
        functional: "./output_revised.txt",
        boundary: "./output_boundary_revised.txt",
        exception: "./output_exception_revised.txt",
        xml: "./yaksha-test-cases.xml"
    };

    let resultStatus = result.status === 'Passed' ? 'PASS' : 'FAIL';
    let output = `${result.methodName}=${resultStatus}\n`;

    let outputFilePath = outputFiles[fileType];
    if (outputFilePath) {
        fs.appendFileSync(outputFilePath, output);
    }
}

// Function to check hoisting behavior with var
function checkHoistingWithVar(ast) {
    let result = 'Passed';
    let feedback = [];
    let varHoistingUsed = false;

    ast.body.forEach((node) => {
        if (node.type === 'VariableDeclaration' && node.kind === 'var') {
            varHoistingUsed = true;
        }
    });

    if (!varHoistingUsed) {
        result = 'Failed';
        feedback.push("You must demonstrate hoisting with the 'var' keyword.");
    }

    // Detailed logging of the check
    console.log(`\x1b[33mChecking hoisting with var\x1b[0m`);

    return new TestCaseResultDto(
        'HoistingWithVar',
        'functional',
        1,
        result === 'Passed' ? 1 : 0,
        result,
        true,
        feedback.join(', ')
    );
}

// Function to check hoisting behavior with let and const
function checkHoistingWithLetConst(ast) {
    let result = 'Passed';
    let feedback = [];
    let letConstHoistingUsed = false;

    ast.body.forEach((node) => {
        if (node.type === 'VariableDeclaration' && (node.kind === 'let' || node.kind === 'const')) {
            letConstHoistingUsed = true;
        }
    });

    if (!letConstHoistingUsed) {
        result = 'Failed';
        feedback.push("You must demonstrate the correct hoisting behavior with 'let' and 'const'.");
    }

    // Detailed logging of the check
    console.log(`\x1b[33mChecking hoisting with let and const\x1b[0m`);

    return new TestCaseResultDto(
        'HoistingWithLetConst',
        'functional',
        1,
        result === 'Passed' ? 1 : 0,
        result,
        true,
        feedback.join(', ')
    );
}

// Function to check scope with var (should be local to the function)
function checkScopeWithVar(ast) {
    let result = 'Passed';
    let feedback = [];
    let varScopeUsed = false;

    ast.body.forEach((node) => {
        if (node.type === 'FunctionDeclaration') {
            node.body.body.forEach((statement) => {
                if (statement.type === 'VariableDeclaration' && statement.kind === 'var') {
                    varScopeUsed = true;
                }
            });
        }
    });

    if (!varScopeUsed) {
        result = 'Failed';
        feedback.push("You must use 'var' inside a function to demonstrate local scope.");
    }

    // Detailed logging of the check
    console.log(`\x1b[33mChecking scope with var\x1b[0m`);

    return new TestCaseResultDto(
        'ScopeWithVar',
        'functional',
        1,
        result === 'Passed' ? 1 : 0,
        result,
        true,
        feedback.join(', ')
    );
}

// Function to check scope with let and const (should be block-scoped)
function checkScopeWithLetConst(ast) {
    let result = 'Passed';
    let feedback = [];
    let letConstScopeUsed = false;

    ast.body.forEach((node) => {
        if (node.type === 'FunctionDeclaration') {
            node.body.body.forEach((statement) => {
                if ((statement.type === 'VariableDeclaration' && (statement.kind === 'let' || statement.kind === 'const'))) {
                    letConstScopeUsed = true;
                }
            });
        }
    });

    if (!letConstScopeUsed) {
        result = 'Failed';
        feedback.push("You must use 'let' or 'const' inside a function to demonstrate block scope.");
    }

    // Detailed logging of the check
    console.log(`\x1b[33mChecking scope with let and const\x1b[0m`);

    return new TestCaseResultDto(
        'ScopeWithLetConst',
        'functional',
        1,
        result === 'Passed' ? 1 : 0,
        result,
        true,
        feedback.join(', ')
    );
}

// Function to grade the student's code
function gradeAssignment() {
    const studentFilePath = path.join(__dirname, '..', 'index.js');
    let studentCode;

    try {
        studentCode = fs.readFileSync(studentFilePath, 'utf-8');
    } catch (err) {
        console.error("Error reading student's file:", err);
        return;
    }

    const ast = esprima.parseScript(studentCode);

    // Execute checks and prepare testResults
    const testResults = new TestResults();
    const GUID = "d805050e-a0d8-49b0-afbd-46a486105170";  // Example GUID for each test case

    // Assign the results of each test case
    testResults.testCaseResults[GUID] = checkHoistingWithVar(ast);
    testResults.testCaseResults[GUID + '-hoisting-with-let-const'] = checkHoistingWithLetConst(ast);
    testResults.testCaseResults[GUID + '-scope-with-var'] = checkScopeWithVar(ast);
    testResults.testCaseResults[GUID + '-scope-with-let-const'] = checkScopeWithLetConst(ast);

    // Read custom data from the custom.ih file
    testResults.customData = readCustomFile();

    // Send the results of each test case to the server
    Object.values(testResults.testCaseResults).forEach(testCaseResult => {
        const resultsToSend = {
            testCaseResults: {
                [GUID]: testCaseResult
            },
            customData: testResults.customData
        };

        console.log("Sending below data to server");
        console.log(resultsToSend);

        // Log the test result in yellow for pass and red for fail using ANSI codes
        if (testCaseResult.status === 'Passed') {
            console.log(`\x1b[33m${testCaseResult.methodName}: Pass\x1b[0m`); // Yellow for pass
        } else {
            console.log(`\x1b[31m${testCaseResult.methodName}: Fail\x1b[0m`); // Red for fail
        }

        // Send each result to the server
        sendResultToServer(resultsToSend);
    });

    // Generate XML report for each test case
    Object.values(testResults.testCaseResults).forEach(result => {
        const xml = generateXmlReport(result);
        fs.appendFileSync('./test-report.xml', xml);
    });

    // Write to output files for each test case
    Object.values(testResults.testCaseResults).forEach(result => {
        writeOutputFiles(result, 'functional');
    });
}

// Function to delete output files
function deleteOutputFiles() {
    const outputFiles = [
        "./output_revised.txt",
        "./output_boundary_revised.txt",
        "./output_exception_revised.txt",
        "./yaksha-test-cases.xml"
    ];

    outputFiles.forEach(file => {
        // Check if the file exists
        if (fs.existsSync(file)) {
            // Delete the file if it exists
            fs.unlinkSync(file);
            console.log(`Deleted: ${file}`);
        }
    });
}

// Function to delete output files and run the grading function
function executeGrader() {
    // Delete all output files first
    deleteOutputFiles();

    // Run the grading function
    gradeAssignment();
}

// Execute the custom grader function
executeGrader();
