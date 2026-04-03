/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Vous êtes invité(e) à rejoindre Qual'IA</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>Qual'IA</Text>
        <Heading style={h1}>Vous avez été invité(e)</Heading>
        <Text style={text}>
          Vous avez été invité(e) à rejoindre{' '}
          <Link href={siteUrl} style={link}>
            <strong>Qual'IA</strong>
          </Link>
          , la plateforme intelligente de préparation à la certification Qualiopi.
        </Text>
        <Text style={text}>
          Cliquez ci-dessous pour accepter l'invitation et créer votre compte :
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accepter l'invitation
        </Button>
        <Text style={footer}>
          Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.
        </Text>
        <Text style={footer}>
          — L'équipe Qual'IA · Groupe Averreo
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
const link = { color: '#1e3a5f', textDecoration: 'underline' }
const button = {
  backgroundColor: '#1e3a5f',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#8898aa', margin: '30px 0 0', lineHeight: '1.5' }
