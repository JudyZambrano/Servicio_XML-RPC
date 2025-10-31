const { PrismaClient } = require("./generated/prisma");
const xmlrpc = require("davexmlrpc");

const prisma = new PrismaClient();

var config = {
  port: 1417,
  xmlRpcPath: "/rpc2",
};

xmlrpc.startServerOverHttp(config, async function (request) {
  switch (request.verb) {
    case "getUsers":
      const users = await prisma.user.findMany();
      request.returnVal(undefined, users);
      return true;
    case "getUserById":
      const userId1 = request.params[0];
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId1 },
        });
        if (!user) {
          request.returnVal(new Error("Usuario no encontrado"));
          return true;
        }
        request.returnVal(undefined, user);
        return true;
      } catch (error) {
        request.returnVal(
          new Error("Error al obtner el usuario: " + error.meta.cause)
        );
        return true;
      }
    case "AddUser":
      const regEmail =
        /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
      const email = request.params[0];
      const name = request.params[1];
      if (!email || !regEmail.test(email)) {
        request.returnVal(new Error("Correo Invalido"));
        return true;
      }
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: email },
        });
        if (existingUser) {
          request.returnVal(new Error("Ya existe un usuario con este correo"));
          return true;
        }
        const newUser = await prisma.user.create({
          data: {
            email: email,
            name: name,
          },
        });
        request.returnVal(undefined, { message: "Usuario creado", newUser });
        return true;
      } catch (error) {
        request.returnVal(
          new Error("Error al crear usuario: " + error.meta.cause)
        );
        return true;
      }
    case "DeleteUser":
      const userId = request.params[0];
      try {
        const deletedUser = await prisma.user.delete({
          where: { id: userId },
        });
        request.returnVal(undefined, {
          message: "Usuario Eliminado",
          deletedUser,
        });
        return true;
      } catch (error) {
        request.returnVal(
          new Error("Error al eliminar el usuario: " + error.meta.cause)
        );
        return true;
      }
    case "UpdateUser":
      const updateUserId = request.params[0];
      const newEmail = request.params[1];
      const newName = request.params[2];

      try {
        const regEmail =
          /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
        if (newEmail && !regEmail.test(newEmail)) {
          request.returnVal(new Error("Correo Invalido"));
          return true;
        }

        if (newEmail) {
          const existing = await prisma.user.findUnique({
            where: { email: newEmail },
          });
          if (existing && String(existing.id) !== String(updateUserId)) {
            request.returnVal(
              new Error("Ya existe un usuario con este correo")
            );
            return true;
          }
        }

        const updatedUser = await prisma.user.update({
          where: { id: updateUserId },
          data: {
            email: newEmail,
            name: newName,
          },
        });

        request.returnVal(undefined, {
          message: "Usuario actualizado",
          updatedUser,
        });
        return true;
      } catch (error) {
        request.returnVal(
          new Error("Error al actualizar el usuario: " + error.meta.cause)
        );
        return true;
      }
  }
  return false;
});
