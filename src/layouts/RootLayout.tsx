import { Outlet, NavLink } from 'react-router-dom';
import styled from 'styled-components';
import {
  GlobalStyle,
  TopNav,
  PhaseBanner,
  Footer,
  Main,
  SkipLink,
  Link as GovLink
} from 'govuk-react';
import CrownIcon from '@govuk-react/icon-crown';

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f3f2f1;
`;

const StyledMain = styled(Main)`
  flex: 1;
  background: #ffffff;
  padding: 2rem 1.5rem 3rem;
`;

const NavigationLink = styled(TopNav.NavLink)`
  &.active {
    font-weight: bold;
    text-decoration: underline;
  }
`;

const ContentContainer = styled.div`
  margin: 0 auto;
  width: 100%;
  max-width: 960px;
`;

const StyledFooter = styled(Footer)`
  background: #0b0c0c;
  color: #fff;
`;

const footerMeta = (
  <>
    <Footer.MetaLinks heading="Support links">
      <Footer.Link as={GovLink} href="https://www.gov.uk/service-manual">
        Service Manual
      </Footer.Link>
      <Footer.Link as={GovLink} href="https://design-system.service.gov.uk">
        Design System
      </Footer.Link>
      <Footer.Link as={GovLink} href="https://www.gov.uk/help/accessibility-statement">
        Accessibility statement
      </Footer.Link>
    </Footer.MetaLinks>
    <Footer.MetaCustom>
      <p>
        Built for training purposes. Always pair prototypes with research, accessibility and service
        standards.
      </p>
    </Footer.MetaCustom>
  </>
);

export const RootLayout = () => (
  <PageWrapper>
    <GlobalStyle />
    <SkipLink href="#main-content">Skip to main content</SkipLink>
    <TopNav
      company={<TopNav.IconTitle icon={<CrownIcon height="32" width="36" />}>GOV.UK</TopNav.IconTitle>}
      serviceTitle={<span>Service builder explorer</span>}
    >
      <NavigationLink as={NavLink} to="/" end>
        Services
      </NavigationLink>
      <NavigationLink as={NavLink} to="/about-gds">
        About GDS
      </NavigationLink>
    </TopNav>
    <PhaseBanner level="beta">
      Forms are generated directly from the Service Builder OpenAPI definition and follow the GOV.UK Design
      System by default.
    </PhaseBanner>
    <StyledMain id="main-content">
      <ContentContainer>
        <Outlet />
      </ContentContainer>
    </StyledMain>
    <StyledFooter meta={footerMeta} />
  </PageWrapper>
);
