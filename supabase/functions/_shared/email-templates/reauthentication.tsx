/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre code de vérification Qual'IA</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>Qual'IA</Text>
        <Heading style={h1}>Code de vérification</Heading>
        <Text style={text}>
          Utilisez le code ci-dessous pour confirmer votre identité :
        </Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Ce code expirera dans quelques minutes. Si vous n'avez pas fait cette demande,
          ignorez cet email.
        </Text>
        <Text style={footer}>
          — L'équipe Qual'IA · Groupe Averreo
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', 'Source Sans 3', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const logo = {
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#1e3a5f',
  margin: '0 0 24px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#1e3a5f',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#3c4257',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#1e3a5f',
  margin: '0 0 30px',
  letterSpacing: '4px',
}
const footer = { fontSize: '12px', color: '#8898aa', margin: '30px 0 0', lineHeight: '1.5' }
