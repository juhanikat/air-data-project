import { User } from "@/services/api";
import { Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { IoLogIn, IoPerson, IoSettings } from "react-icons/io5";

export function Header(props: { setPage: (page: string) => void, user: User | undefined }) {
    return <Flex
        width="100%"
        height="100%"
        justifyContent="space-between"
        alignItems="center"
    >
        <Stack>
            <Heading size="2xl">Air Data Project</Heading>
            <Text fontStyle="italic" color="blackAlpha.800">Collection & science!</Text>
        </Stack>

        <Flex>
            {
                props.user ?
                    <Button mr={4} variant="outline" onClick={() => props.setPage("accountPage")}>
                        <IoPerson />
                        <Text ml={2}>{props.user.name}</Text>
                    </Button>
                : <></>
            }

            <Button onClick={() => {
                props.setPage(props.user ? "settingsPage" : "loginPage")
            }}>
                { props.user ? <IoSettings /> : <IoLogIn /> }
                { props.user ? "Settings" : "Login" }
            </Button>
        </Flex>
    </Flex>
}
