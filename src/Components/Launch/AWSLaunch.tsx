import React from 'react';

import { Button, List, ListComponent, ListItem, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant, OrderType } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';

import { ComposesResponseItem, useGetComposeStatusQuery } from '../../store/imageBuilderApi';
import { isAwsUploadRequestOptions } from '../../store/typeGuards';

type LaunchProps = {
  isOpen: boolean;
  handleModalToggle: (event: KeyboardEvent | React.MouseEvent) => void;
  compose: ComposesResponseItem;
};

export const AWSLaunch = ({
    isOpen,
    handleModalToggle,
    compose,
}: LaunchProps) => {
  const options = compose.request.image_requests[0].upload_request.options;
  const { data: composeStatusData, isSuccess: isComposeStatusSuccess } = useGetComposeStatusQuery({
    composeId: compose.id,
  });

  if (!isAwsUploadRequestOptions(options)) {
    throw TypeError(
      `Error: options must be of type AwsUploadRequestOptions, not ${typeof options}.`
    );
  }

  const amiId =
  isComposeStatusSuccess &&
  composeStatusData?.image_status.status === 'success' && composeStatusData.image_status.upload_status?.options &&
  'ami' in composeStatusData.image_status.upload_status.options
    ? composeStatusData.image_status.upload_status.options.ami
    : '';
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalToggle}
      variant={ModalVariant.large}
      aria-label="Open launch wizard"
    >
        <ModalHeader title={"Launch with Amazon Web Services"} labelId="modal-title" description={compose.image_name} />
        <ModalBody id="modal-box-body-basic">
          <List component={ListComponent.ol} type={OrderType.number}>
            <ListItem>Navigate to the <Button component="a" target="_blank" variant="link"
              icon={<ExternalLinkAltIcon />}
              iconPosition="right"
              href={`https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#ImageDetails:imageId=${amiId}`}
              className="pf-v6-u-pl-0"
            >
                {amiId} detail page
              </Button> located on your AWS console.</ListItem>
            <ListItem>
              Copy <span className="pf-v6-u-font-weight-bold">{amiId}</span> to make it a permanent copy in your account.
              <br />
              Shared with <span className="pf-v6-u-font-weight-bold">Account {options.share_with_accounts?.[0]}</span>
              <br />
              <span className="pf-v6-u-font-weight-bold">AMI ID: {amiId}</span>
            </ListItem>
            <ListItem>Launch <span className="pf-v6-u-font-weight-bold">{amiId}</span> as an instance</ListItem>
            <ListItem>Connect to it via SSH using the following username: <span className="pf-v6-u-font-weight-bold">ec2-user</span></ListItem>
          </List>
        </ModalBody>
        <ModalFooter>
        <Button key="close" variant="primary" onClick={handleModalToggle}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};
