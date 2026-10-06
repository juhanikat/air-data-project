import {
  Button,
  Heading,
  Stack,
} from "@chakra-ui/react";
import api, { User } from "../services/api"


function AccountPage(props: { setUser: (user: User | undefined) => void }){
    return <Stack alignItems="flex-start">
        <Heading>My Account</Heading>

        <Button onClick={() => {
            props.setUser(undefined)
            api.logout()
        }}>
            Logout
        </Button>
    </Stack>
};

export default AccountPage;
