const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// converting state object to response object
const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

// converting district object to response object:
const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// API -- 1 get all States from state db :
app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
    SELECT * FROM 
    state
    `;
  const stateArray = await db.all(getAllStatesQuery);
  const stateResult = stateArray.map((eachObject) => {
    return convertStateDbObjectToResponseObject(eachObject);
  });
  response.send(stateArray);
});

//API -- 2 get a specific state:
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM 
    state
    WHERE state_id = ${stateId};
    `;
  const stateArray = await db.get(getStateQuery);
  const stateResult = convertStateDbObjectToResponseObject(stateArray);
  response.send(stateResult);
});

// API --3 for creating an new district for district DB:
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrict = `
     INSERT INTO 
     district 
     (districtName,stateId,cases,cured,active,deaths)
     VALUES (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
     );`;
  const districtArray = await db.run(addDistrict);
  //const districtResult = convertDistrictDbObjectToResponseObject(districtArray);
  response.send("District Successfully Added");
});

// API --4  return district based on district Id
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictId = `
    SELECT * FROM 
    district 
    WHERE 
    district_id = ${districtId};
    `;
  const districtArray = await db.get(getDistrictId);
  const districtResult = convertDistrictDbObjectToResponseObject(districtArray);
  response.send(districtResult);
});

// API -- 5 for deleting district:
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
    DELETE * FROM 
    district 
    WHERE district_id = ${districtID};
    `;
  await db.run(deleteDistrict);
  response.send("District Removed");
});

// API -- 6 for updating district
app.put("/districts/:districtId/", async (request, response) => {
  const { districtID } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrict = ` 
    UPDATE district 
    SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE 
        district_id = ${districtId};
    `;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});

// API --7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateReport = `  
     SELECT SUM(cases) AS cases,
     SUM(cured) AS cured,
     SUM(active) AS active,
     SUM(deaths) AS deaths
     FROM district 
     WHERE state_id = ${state_Id};
    `;
  const stateReport = await db.get(getStateReport);
  const resultReport = convertDistrictDbObjectToResponseObject(stateReport);
  response.send(resultReport);
});
module.exports = app;
