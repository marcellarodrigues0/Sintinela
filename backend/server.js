const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "../frontend")));

const DB_FILE = path.join(__dirname, "db.json");

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    return {
      usuarios: [],
      pacientes: [],
      triagens: [],
      consultas: []
    };
  }

  return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// LOGIN
app.post("/login", (req, res) => {
  const db = readDB();

  const user = db.usuarios.find(u =>
    u.usuario === req.body.usuario &&
    u.senha === req.body.senha
  );

  if (!user) {
    return res.status(401).json({
      erro: "Login inválido"
    });
  }

  res.json(user);
});

// ATENDIMENTO
app.post("/atendimento", (req, res) => {
  const db = readDB();

  const paciente = {
    id: Date.now(),
    nome: req.body.nome,
    cpf: req.body.cpf,
    tipo: req.body.tipo,
    status: "triagem",
    createdAt: new Date()
  };

  db.pacientes.push(paciente);
  writeDB(db);

  res.json(paciente);
});

// TRIAGEM
app.post("/triagem", (req, res) => {
  const db = readDB();

  let risco = req.body.risco;

  if (req.body.temperatura >= 39) {
    risco = "vermelho";
  } else if (req.body.temperatura >= 38) {
    risco = "amarelo";
  } else if (!risco) {
    risco = "verde";
  }

  const triagem = {
    id: Date.now(),
    nome: req.body.nome,
    sintoma: req.body.sintoma,
    temperatura: req.body.temperatura,
    alergia: req.body.alergia,
    observacao: req.body.observacao,
    risco,
    status: "aguardando_medico",
    createdAt: new Date()
  };

  db.triagens.push(triagem);
  writeDB(db);

  res.json(triagem);
});

// LISTAR TRIAGENS
app.get("/triagens", (req, res) => {
  const db = readDB();
  res.json(db.triagens);
});

// IMPLEMENTADO: rota com lista fixa de medicações
app.get("/lista-medicacoes", (req, res) => {
  res.json([
    "Dipirona",
    "Paracetamol",
    "Ibuprofeno",
    "Amoxicilina",
    "Azitromicina",
    "Loratadina",
    "Omeprazol",
    "Buscopan",
    "Dramin",
    "Soro fisiológico"
  ]);
});

// CONSULTA
app.post("/consulta", (req, res) => {
  const db = readDB();

  const consulta = {
    id: Date.now(),
    paciente: req.body.paciente,
    diagnostico: req.body.diagnostico,
    medicacao: req.body.medicacao,
    obs: req.body.obs,
    createdAt: new Date()
  };

  db.consultas.push(consulta);
  writeDB(db);

  res.json(consulta);
});

// MEDICAÇÕES
app.get("/medicacoes", (req, res) => {
  const db = readDB();
  res.json(db.consultas);
});


/* CADASTRAR USUÁRIO */
app.post("/usuarios", (req, res) => {
  try {
    const { usuario, senha, tipo } = req.body;

    if (!usuario || !senha || !tipo) {
      return res.status(400).json({
        erro: "Preencha usuário, senha e setor."
      });
    }

    const db = readDB();

    // Garantir que a lista exista no banco.
    if (!Array.isArray(db.usuarios)) {
      db.usuarios = [];
    }

    const nomeUsuario = usuario.trim();

    const existe = db.usuarios.some(
      u => u.usuario.toLowerCase() === nomeUsuario.toLowerCase()
    );

    if (existe) {
      return res.status(409).json({
        erro: "Esse usuário já está cadastrado."
      });
    }

    const novoUsuario = {
      id: Date.now(),
      usuario: nomeUsuario,
      senha,
      tipo
    };

    db.usuarios.push(novoUsuario);
    writeDB(db);

    res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso!",
      usuario: {
        id: novoUsuario.id,
        usuario: novoUsuario.usuario,
        tipo: novoUsuario.tipo
      }
    });
  } catch (erro) {
    console.error("Erro ao cadastrar usuário:", erro);
    res.status(500).json({
      erro: "Não foi possível salvar o usuário."
    });
  }
});


app.post("/usuarios", (req, res) => {
    console.log("📩 Dados recebidos:", req.body);

    try {
        const { usuario, senha, tipo } = req.body;

        if (!usuario?.trim() || !senha || !tipo) {
            return res.status(400).json({
                erro: "Preencha todos os campos."
            });
        }

        const db = readDB();

        if (!Array.isArray(db.usuarios)) {
            db.usuarios = [];
        }

        const nomeUsuario = usuario.trim();

        const existe = db.usuarios.some(
            u => u.usuario.toLowerCase() === nomeUsuario.toLowerCase()
        );

        if (existe) {
            return res.status(409).json({
                erro: "Esse nome de usuário já existe."
            });
        }

        const novoUsuario = {
            id: Date.now(),
            usuario: nomeUsuario,
            senha,
            tipo
        };

        db.usuarios.push(novoUsuario);
        writeDB(db);

        console.log("✅ Usuário gravado em:", DB_FILE);

        return res.status(201).json({
            mensagem: "Usuário cadastrado com sucesso!",
            usuario: {
                id: novoUsuario.id,
                usuario: novoUsuario.usuario,
                tipo: novoUsuario.tipo
            }
        });

    } catch (erro) {
        console.error("❌ Erro ao salvar:", erro);

        return res.status(500).json({
            erro: "Erro ao gravar no banco: " + erro.message
        });
    }
});



// START
app.listen(3000, () => {
  console.log("🏥 Hospital Pro rodando em http://localhost:3000");
});