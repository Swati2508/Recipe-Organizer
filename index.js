import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';

const PORT = 3000;
const app = express();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'cdac',
    database: 'recipebook',
    ssl: false
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send({ message: "Welcome to the Recipe Organizer" });
});

app.post("/recipes", (req, res) => {
    const { name, category, ingredients, instructions } = req.body;
    const insertQuery = `INSERT INTO recipes (name, category, ingredients, instructions) VALUES (?, ?, ?, ?)`;

    connection.query(insertQuery, [name, category, ingredients, instructions], (error, results) => {
        if (error) {
            console.error("Error inserting recipe:", error);
            res.status(500).send({ message: "Error inserting recipe" });
        } else {
            res.status(201).send({ message: "Recipe added successfully", id: results.insertId });
        }
    });
});

app.get("/recipes", (req, res) => {
    const selectQuery = `SELECT * FROM recipes`;
    connection.query(selectQuery, (error, results) => {
        if (error) {
            res.status(500).send({ message: "Error fetching recipes" });
        } else {
            res.status(200).send(results);
        }
    });
});

app.get("/recipes/:id", (req, res) => {
    const selectQuery = `SELECT * FROM recipes WHERE id = ?`;
    connection.query(selectQuery, [req.params.id], (error, results) => {
        if (error) {
            res.status(500).send({ message: "Error fetching recipe" });
        } else if (results.length === 0) {
            res.status(404).send({ message: "Recipe not found" });
        } else {
            res.status(200).send(results[0]);
        }
    });
});

app.put("/recipes/:id", (req, res) => {
    const recipeId = req.params.id;
    const { name, ingredients, instructions } = req.body;

    const updateQuery = `
        UPDATE recipes 
        SET name = ?, ingredients = ?, instructions = ?
        WHERE id = ?
    `;

    connection.query(updateQuery, [name, ingredients, instructions, recipeId], (error, results) => {
        if (error) {
            res.status(500).send({ message: "Error updating recipe" });
        } else if (results.affectedRows === 0) {
            res.status(404).send({ message: "Recipe not found" });
        } else {
            res.status(200).send({ message: "Recipe updated successfully" });
        }
    });
});


app.delete("/recipes/:id", (req, res) => {
    const recipeId = req.params.id;
    const deleteQuery = `DELETE FROM recipes WHERE id = ?`;

    connection.query(deleteQuery, [recipeId], (error, results) => {
        if (error) {
            res.status(500).send({ message: "Error deleting recipe" });
        } else {
            const checkEmptyQuery = `SELECT COUNT(*) AS count FROM recipes`;
            connection.query(checkEmptyQuery, (countError, countResults) => {
                if (countError) {
                    console.error("Error checking if table is empty:", countError);
                    res.status(500).send({ message: "Error checking table status" });
                } else if (countResults[0].count === 0) {
                    const resetAutoIncrementQuery = `ALTER TABLE recipes AUTO_INCREMENT = 1`;
                    connection.query(resetAutoIncrementQuery, (resetError) => {
                        if (resetError) {
                            console.error("Error resetting AUTO_INCREMENT:", resetError);
                            res.status(500).send({ message: "Error resetting AUTO_INCREMENT" });
                        } else {
                            res.status(200).send({ message: "Recipe deleted successfully and AUTO_INCREMENT reset" });
                        }
                    });
                } else {
                    res.status(200).send({ message: "Recipe deleted successfully" });
                }
            });
        }
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connection.connect((error) => {
        if (error) {
            console.error("Error connecting to the database:", error);
        } else {
            console.log("Connected to the database");
        }
    });
});
