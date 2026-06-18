"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/format";

const PIE_COLORS = ["#1f4f99", "#15803d", "#d97706", "#b91c1c", "#7e22ce", "#0891b2", "#be185d", "#475569"];

type Monthly = { mes: string; entradas: number; saidas: number; saldo: number };
type Weekly = {
  semana: string;
  novosContatos: number;
  sessoes: number;
  planosVendidos: number;
  tarefasConcluidas: number;
  tarefasAbertas: number;
};

export function ReportsCharts({
  monthly,
  weekly,
  patientsByStatus,
  incomeByCategory,
  incomeByMethod,
  taskStatus,
}: {
  monthly: Monthly[];
  weekly: Weekly[];
  patientsByStatus: { status: string; quantidade: number }[];
  incomeByCategory: { categoria: string; valor: number }[];
  incomeByMethod: { forma: string; valor: number }[];
  taskStatus: { status: string; quantidade: number }[];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Entradas, Saídas e Saldo (12 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => formatBRL(Number(v))} />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill="#15803d" radius={[6, 6, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="#b91c1c" radius={[6, 6, 0, 0]} />
                <Bar dataKey="saldo" name="Saldo" fill="#1f4f99" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pacientes por status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={patientsByStatus}
                  dataKey="quantidade"
                  nameKey="status"
                  outerRadius={90}
                  label={(entry) => `${entry.status} (${entry.quantidade})`}
                >
                  {patientsByStatus.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tarefas por status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskStatus} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="status" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="quantidade" name="Quantidade" fill="#1f4f99" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entradas por categoria (6m)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeByCategory}
                  dataKey="valor"
                  nameKey="categoria"
                  outerRadius={90}
                  label={(entry) => entry.categoria}
                >
                  {incomeByCategory.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatBRL(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entradas por forma de pagamento (6m)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeByMethod}
                  dataKey="valor"
                  nameKey="forma"
                  outerRadius={90}
                  label={(entry) => entry.forma}
                >
                  {incomeByMethod.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatBRL(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Operacional semanal (12 semanas)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="novosContatos" name="Novos contatos" stroke="#1f4f99" strokeWidth={2} />
                <Line type="monotone" dataKey="sessoes" name="Sessões" stroke="#15803d" strokeWidth={2} />
                <Line type="monotone" dataKey="planosVendidos" name="Planos vendidos" stroke="#7e22ce" strokeWidth={2} />
                <Line type="monotone" dataKey="tarefasConcluidas" name="Tarefas concluídas" stroke="#0891b2" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
