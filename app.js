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

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDbObjectToResponseObject2 = (dbObject) => {
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

const convertDbObjectToResponseObject3 = (dbObject) => {
  return {
    TotalCases: dbObject.cases,
    TotalCured: dbObject.cured,
    TotalActive: dbObject.active,
    TotalDeaths: dbObject.deaths,
  };
};

initializeDBAndServer();

app.get("/states/", async (request, response) => {
  const getstatesQuery = `
    SELECT
      *
    FROM
      state
   ;`;
  const statesArray = await db.all(getstatesQuery);
  response.send(
    statesArray.map((eachMovie) => convertDbObjectToResponseObject(eachMovie))
  );
});

app.get("/districts/", async (request, response) => {
  const getdistrictsQuery = `
    SELECT
      *
    FROM
      district
   ;`;
  const districtsArray = await db.all(getdistrictsQuery);
  response.send(districtsArray);
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  console.log(stateId);
  const getstateQuery = `
    SELECT
      *
    FROM
     state
    WHERE
      state_id = ${stateId};`;
  const state = await db.get(getstateQuery);
  //   console.log(movie);
  response.send(convertDbObjectToResponseObject(state));
});
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  //   console.log(districtId);
  const getdistrictQuery = `
    SELECT
      *
    FROM
     district
    WHERE
      district_id = ${districtId};`;
  const district = await db.get(getdistrictQuery);
  // console.log(district);
  response.send(convertDbObjectToResponseObject2(district));
});

app.get("/districts/:districtId/details/", async (request, response) => {
    const {districtId}=request.params
  const getstatesQuery = `
    SELECT
      state.state_name
    FROM
      state JOIN district ON state.state_id=district.state_id
      where district.district_id=${districtId}
   ;`;
  const statesArray = await db.get(getstatesQuery);
  response.send(statesArray);
//   response.send(
//     statesArray.map((eachMovie) => convertDbObjectToResponseObject(eachMovie))
//   );
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  //   console.log(districtId);
  const getstateQuery = `
    SELECT
      sum(cases) as cases,
        sum(cured)as cured,
          sum(active)as active,
            sum(deaths)as deaths
    FROM
     district
    WHERE
     state_id = ${stateId};`;
  const state = await db.get(getstateQuery);
  console.log(state)
  const responseObject = convertDbObjectToResponseObject3(state); 
  response.send(responseObject);
});

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
  const adddistrictQuery = `
    INSERT INTO
      district (district_name, state_id, cases,cured,active,deaths )
    VALUES
      (

         '${districtName}',
         '${stateId}',
         '${cases}',
         '${cured}',
         '${active}',
         '${deaths}'
      );`;
  const dbResponse = await db.run(adddistrictQuery);
  const districtId = dbResponse.lastID;
  response.send("District Successfully Added");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updatedistrictQuery = `
    UPDATE
      district
    SET
      district_name='${districtName}',
      state_id='${stateId}',
      state_id='${stateId}',
      cases='${cases}',
      cured='${cured}',
      active='${active}'
     WHERE
      district_id = ${districtId};`;
  await db.run(updatedistrictQuery);
  response.send("District Details Updated");
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deletedistrictQuery = `
    DELETE FROM
        district
    WHERE
      district_id = ${districtId};`;
  await db.run(deletedistrictQuery);
  response.send("District Removed");
});
module.exports = app;
