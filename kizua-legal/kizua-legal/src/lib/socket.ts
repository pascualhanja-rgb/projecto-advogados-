"use client";

import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "./api";

let socket: Socket | null = null;
let connecting: Promise<Socket> | null = null;

/** Resolve a URL base do socket (sem /api/v1). */
function socketUrl(): string {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "https://kizua-legal.onrender.com/api/v1";
  return api.replace(/\/api\/v1\/?$/, "");
}

/**
 * Ligação Socket.io autenticada com o token de acesso.
 * Reutiliza a instância existente quando já ligada.
 */
export function getSocket(): Promise<Socket> {
  if (socket?.connected) return Promise.resolve(socket);
  if (connecting) return connecting;

  connecting = new Promise((resolve, reject) => {
    const token = getAccessToken();
    if (!token) {
      connecting = null;
      reject(new Error("Sem token de acesso para o socket"));
      return;
    }
    socket = io(socketUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    });

    socket.on("connect", () => resolve(socket!));
    socket.on("connect_error", (err) => {
      connecting = null;
      reject(err);
    });

    // Se o token expirou e reconectou, atualiza o auth
    socket.io.on("reconnect_attempt", () => {
      const t = getAccessToken();
      if (t && socket) socket.auth = { token: t };
    });
  });

  return connecting;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  connecting = null;
}
