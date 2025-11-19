
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { PartnershipClick } from "@/api/entities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, MessageCircle } from "lucide-react";
import { BRAND } from "@/components/common/Branding";

export default function MarketingPage() {
  const [user, setUser] = useState(null);
  useEffect(()=>{ (async()=> setUser(await User.me()))(); },[]);
  const handleClick = async () => {
    if (!user) return;
    await PartnershipClick.create({
      partner_code:"LICITAFORGE",
      user_email: user.email,
      cnpj: user.cnpj,
      clicked_at: new Date().toISOString()
    });
    window.open(`https://wa.me/5599999999999?text=Olá%20LICITAFORGE%2C%20sou%20cliente%20${encodeURIComponent(BRAND.name)}`, "_blank");
  };
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Rocket className="w-5 h-5 text-purple-600" /> Marketing & Parcerias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-purple-50 rounded border">
            <h3 className="font-semibold text-purple-900 mb-1">Consultoria de Licitações – LICITAFORGE</h3>
            <p className="text-purple-800 text-sm">Apoio completo para participar e vencer licitações, com análise de edital, documentação e estratégia de preço.</p>
            <Button onClick={handleClick} className="mt-3"><MessageCircle className="w-4 h-4 mr-2" /> Falar com a LICITAFORGE</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
